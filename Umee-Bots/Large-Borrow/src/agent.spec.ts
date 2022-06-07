import BigNumber from "bignumber.js";
import { ethers, HandleTransaction } from "forta-agent";
import { MockEthersProvider, TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { BALANCE_OF_ABI, BORROW_ABI, GET_RESERVE_DATA_ABI } from "./constants";
import { createFinding, SmartCaller } from "./utils";

const LENDING_POOL_ADDRESS = createAddress("0x4001");
const LENDING_POOL_IFACE = new ethers.utils.Interface([BORROW_ABI, GET_RESERVE_DATA_ABI]);
const ERC20_IFACE = new ethers.utils.Interface([BALANCE_OF_ABI]);
const USER_ADDRESS = createAddress("0x1");
const ON_BEHALF_OF_ADDRESS = createAddress("0x2");

function addBorrow(
  txEvent: TestTransactionEvent,
  lendingPool: string = createAddress("0x0"),
  reserve: string = createAddress("0x0"),
  user: string = createAddress("0x0"),
  onBehalfOf: string = createAddress("0x0"),
  amount: ethers.BigNumber = ethers.BigNumber.from(0)
) {
  return txEvent.addInterfaceEventLog(LENDING_POOL_IFACE.getEvent("Borrow"), lendingPool, [
    reserve,
    user,
    onBehalfOf,
    amount,
    ethers.BigNumber.from(0),
    ethers.BigNumber.from(0),
    ethers.BigNumber.from(0),
  ]);
}

function addReserve(
  mockProvider: MockEthersProvider,
  lendingPool: string,
  asset: string,
  uToken: string,
  tvl: ethers.BigNumber,
  block: number
) {
  mockProvider.addCallTo(lendingPool, block, LENDING_POOL_IFACE, "getReserveData", {
    inputs: [asset],
    outputs: [
      {
        configuration: { data: ethers.BigNumber.from(0) },
        liquidityIndex: ethers.BigNumber.from(0),
        variableBorrowIndex: ethers.BigNumber.from(0),
        currentLiquidityRate: ethers.BigNumber.from(0),
        currentVariableBorrowRate: ethers.BigNumber.from(0),
        currentStableBorrowRate: ethers.BigNumber.from(0),
        lastUpdateTimestamp: ethers.BigNumber.from(0),
        uTokenAddress: uToken,
        stableDebtTokenAddress: createAddress("0x0"),
        variableDebtTokenAddress: createAddress("0x0"),
        interestRateStrategyAddress: createAddress("0x0"),
        id: ethers.BigNumber.from(0),
      },
    ],
  });

  mockProvider.addCallTo(asset, block - 1, ERC20_IFACE, "balanceOf", {
    inputs: [uToken],
    outputs: [tvl],
  });
}

describe("large borrow bot", () => {
  describe("handleTransaction", () => {
    let handleTransaction: HandleTransaction;
    let mockProvider: MockEthersProvider;
    let provider: ethers.providers.Provider;

    beforeEach(() => {
      mockProvider = new MockEthersProvider();
      provider = mockProvider as any as ethers.providers.Provider;

      SmartCaller.clearCache();
    });

    it("should return empty findings when handling an empty transaction", async () => {
      const txEvent = new TestTransactionEvent();

      handleTransaction = provideHandleTransaction(provider, {
        lendingPoolAddress: LENDING_POOL_ADDRESS,
        tvlPercentageThreshold: "0",
      });

      expect(await handleTransaction(txEvent)).toStrictEqual([]);
      expect(mockProvider.call).toHaveBeenCalledTimes(0);
    });

    it("should return empty findings if the emitting address is not the lending pool's", async () => {
      const txEvent = new TestTransactionEvent();

      addBorrow(txEvent, createAddress("0x40012"));
      addBorrow(txEvent, createAddress("0x40013"));

      handleTransaction = provideHandleTransaction(provider, {
        lendingPoolAddress: LENDING_POOL_ADDRESS,
        tvlPercentageThreshold: "0",
      });

      expect(await handleTransaction(txEvent)).toStrictEqual([]);
      expect(mockProvider.call).toHaveBeenCalledTimes(0);
    });

    it("should return empty findings if the borrowed amount is less than the TVL threshold", async () => {
      const txEvent = new TestTransactionEvent().setBlock(1000);
      const config = {
        lendingPoolAddress: LENDING_POOL_ADDRESS,
        tvlPercentageThreshold: "50.5",
      };

      handleTransaction = provideHandleTransaction(provider, config);

      const reserve = createAddress("0x2e");
      const uToken = createAddress("0x2f");
      const reserveAmount = ethers.BigNumber.from("10000"); // threshold = 10000 * 0.505 = 5050
      const borrowAmount = ethers.BigNumber.from("5049"); // 5050 - 1

      addBorrow(txEvent, LENDING_POOL_ADDRESS, reserve, USER_ADDRESS, ON_BEHALF_OF_ADDRESS, borrowAmount);
      addReserve(mockProvider, LENDING_POOL_ADDRESS, reserve, uToken, reserveAmount, 1000);

      expect(await handleTransaction(txEvent)).toStrictEqual([]);
      expect(mockProvider.call).toHaveBeenCalledTimes(2);
    });

    it("should cache uToken addresses and uToken asset balance", async () => {
      const txEvent = new TestTransactionEvent().setBlock(1000);
      const config = {
        lendingPoolAddress: LENDING_POOL_ADDRESS,
        tvlPercentageThreshold: "50.5",
      };

      handleTransaction = provideHandleTransaction(provider, config);

      const reserve = createAddress("0x2e");
      const uToken = createAddress("0x2f");
      const reserveAmount = ethers.BigNumber.from("10000");
      const borrowAmount = ethers.BigNumber.from("5049");

      addBorrow(txEvent, LENDING_POOL_ADDRESS, reserve, USER_ADDRESS, ON_BEHALF_OF_ADDRESS, borrowAmount);
      addReserve(mockProvider, LENDING_POOL_ADDRESS, reserve, uToken, reserveAmount, 1000);

      await handleTransaction(txEvent);

      expect(mockProvider.call).toHaveBeenCalledTimes(2);

      await handleTransaction(txEvent);

      expect(mockProvider.call).toHaveBeenCalledTimes(2);
    });

    it("should not repeat similar calls", async () => {
      const txEvent = new TestTransactionEvent().setBlock(1000);
      const config = {
        lendingPoolAddress: LENDING_POOL_ADDRESS,
        tvlPercentageThreshold: "50.5",
      };

      handleTransaction = provideHandleTransaction(provider, config);

      const reserve = createAddress("0x2e");
      const uToken = createAddress("0x2f");
      const reserveAmount = ethers.BigNumber.from("10000");
      const borrowAmount = ethers.BigNumber.from("5049");

      addBorrow(txEvent, LENDING_POOL_ADDRESS, reserve, USER_ADDRESS, ON_BEHALF_OF_ADDRESS, borrowAmount);
      addBorrow(txEvent, LENDING_POOL_ADDRESS, reserve, USER_ADDRESS, ON_BEHALF_OF_ADDRESS, borrowAmount);
      addBorrow(txEvent, LENDING_POOL_ADDRESS, reserve, USER_ADDRESS, ON_BEHALF_OF_ADDRESS, borrowAmount);
      addBorrow(txEvent, LENDING_POOL_ADDRESS, reserve, USER_ADDRESS, ON_BEHALF_OF_ADDRESS, borrowAmount);
      addReserve(mockProvider, LENDING_POOL_ADDRESS, reserve, uToken, reserveAmount, 1000);

      await handleTransaction(txEvent);

      expect(mockProvider.call).toHaveBeenCalledTimes(2);
    });

    it("should return non-empty findings if the borrowed amount is greater than or equal to the TVL threshold", async () => {
      const txEvent = new TestTransactionEvent().setBlock(1000);
      const config = {
        lendingPoolAddress: LENDING_POOL_ADDRESS,
        tvlPercentageThreshold: "50.5",
      };

      handleTransaction = provideHandleTransaction(provider, config);

      const reserves = [
        { asset: createAddress("0x2e1"), uToken: createAddress("0x2f1"), amount: ethers.BigNumber.from("10000") },
        { asset: createAddress("0x2e2"), uToken: createAddress("0x2f2"), amount: ethers.BigNumber.from("500") },
      ];

      reserves.forEach((el) => addReserve(mockProvider, LENDING_POOL_ADDRESS, el.asset, el.uToken, el.amount, 1000));

      const borrows = [
        {
          user: createAddress("0x1"),
          onBehalfOf: createAddress("0x2"),
          reserve: reserves[0].asset,
          amount: ethers.BigNumber.from("5049"),
        },
        {
          user: createAddress("0x3"),
          onBehalfOf: createAddress("0x4"),
          reserve: reserves[0].asset,
          amount: ethers.BigNumber.from("5050"),
        },
        {
          user: createAddress("0x5"),
          onBehalfOf: createAddress("0x6"),
          reserve: reserves[0].asset,
          amount: ethers.BigNumber.from("5051"),
        },
        {
          user: createAddress("0x7"),
          onBehalfOf: createAddress("0x8"),
          reserve: reserves[1].asset,
          amount: ethers.BigNumber.from("252"),
        },
        {
          user: createAddress("0x9"),
          onBehalfOf: createAddress("0xa"),
          reserve: reserves[1].asset,
          amount: ethers.BigNumber.from("253"),
        },
        {
          user: createAddress("0xb"),
          onBehalfOf: createAddress("0xc"),
          reserve: reserves[1].asset,
          amount: ethers.BigNumber.from("254"),
        },
      ];

      borrows.forEach((el) => addBorrow(txEvent, LENDING_POOL_ADDRESS, el.reserve, el.user, el.onBehalfOf, el.amount));

      expect(await handleTransaction(txEvent)).toStrictEqual(
        [borrows[1], borrows[2], borrows[4], borrows[5]].map((borrow) => {
          const reserveAmount = new BigNumber(reserves.find((el) => el.asset === borrow.reserve)!.amount.toString());
          const borrowAmount = new BigNumber(borrow.amount.toString());
          return createFinding(
            borrow.amount,
            borrowAmount.div(reserveAmount).shiftedBy(2),
            borrow.user,
            borrow.onBehalfOf
          );
        })
      );
      // 2 calls for fetching reserve uTokens, 2 calls for fetching the reserves' underlying asset balance
      expect(mockProvider.call).toHaveBeenCalledTimes(2 + 2);
    });
  });
});
