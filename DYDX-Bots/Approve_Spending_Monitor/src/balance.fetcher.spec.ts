import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { BALANCEOF_ABI } from "./utils";
import BalanceFetcher from "./balance.fetcher";
import { Interface } from "ethers/lib/utils";

// format: [blockNumber, module,  balance]
const TEST_DATA_1: [number, string, BigNumber][] = [
  [10, createAddress("0xae1"), BigNumber.from(70)],
  [20, createAddress("0xbe2"), BigNumber.from(100)],
  [30, createAddress("0xae2"), BigNumber.from(100)],
  [40, createAddress("0xce3"), BigNumber.from(120)],
  [50, createAddress("0xde4"), BigNumber.from(240)],
];

// format: [blockNumber,  module,  balance]
const TEST_DATA_2: [number, string, BigNumber][] = [
  [10, createAddress("0xae1"), BigNumber.from(90)],
  [20, createAddress("0xbe2"), BigNumber.from(110)],
  [30, createAddress("0xae2"), BigNumber.from(110)],
  [40, createAddress("0xce3"), BigNumber.from(130)],
  [50, createAddress("0xde4"), BigNumber.from(250)],
];

const usdcAddress = createAddress("0xa1");
const dydxAddress = createAddress("0xa2");

describe("BalanceFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager = {
    usdcAddress: usdcAddress,
    dydxAddress: dydxAddress,
  };

  const fetcher: BalanceFetcher = new BalanceFetcher(mockProvider as any, mockNetworkManager as any);
  beforeEach(() => mockProvider.clear());

  const createBalanceOfCall = (token: string, block: number, module: string, balance: BigNumber) => {
    mockProvider.addCallTo(token, block, new Interface(BALANCEOF_ABI), "balanceOf", {
      inputs: [module],
      outputs: [balance],
    });
  };

  it("should fetch usdc balance and use cache correctly", async () => {
    for (let [block, module, balance] of TEST_DATA_1) {
      createBalanceOfCall(mockNetworkManager.usdcAddress, block, module, balance);

      const fetchedBalance = await fetcher.getUsdcBalanceOf(module, block);
      expect(fetchedBalance).toStrictEqual(balance);
    }

    // clear mock to use cache
    mockProvider.clear();
    for (let [block, module, balance] of TEST_DATA_1) {
      const fetchedBalance = await fetcher.getUsdcBalanceOf(module, block);
      expect(fetchedBalance).toStrictEqual(balance);
    }
  });

  it("should fetch dydx balance and use cache correctly", async () => {
    for (let [block, module, balance] of TEST_DATA_2) {
      createBalanceOfCall(mockNetworkManager.dydxAddress, block, module, balance);

      const fetchedBalance = await fetcher.getdydxBalanceOf(module, block);
      expect(fetchedBalance).toStrictEqual(balance);
    }

    // clear mock to use cache
    mockProvider.clear();
    for (let [block, module, balance] of TEST_DATA_2) {
      const fetchedBalance = await fetcher.getdydxBalanceOf(module, block);
      expect(fetchedBalance).toStrictEqual(balance);
    }
  });

  it("should fetch both usdc and dydx balances and use cache correctly", async () => {
    for (let [block, module, balance] of TEST_DATA_1) {
      createBalanceOfCall(mockNetworkManager.usdcAddress, block, module, balance);

      const fetchedBalance = await fetcher.getUsdcBalanceOf(module, block);
      expect(fetchedBalance).toStrictEqual(balance);
    }

    for (let [block, module, balance] of TEST_DATA_2) {
      createBalanceOfCall(mockNetworkManager.dydxAddress, block, module, balance);

      const fetchedBalance = await fetcher.getdydxBalanceOf(module, block);
      expect(fetchedBalance).toStrictEqual(balance);
    }

    // clear mock to use cache
    mockProvider.clear();
    for (let [block, module, balance] of TEST_DATA_1) {
      const fetchedBalance = await fetcher.getUsdcBalanceOf(module, block);
      expect(fetchedBalance).toStrictEqual(balance);
    }
    for (let [block, module, balance] of TEST_DATA_2) {
      const fetchedBalance = await fetcher.getdydxBalanceOf(module, block);
      expect(fetchedBalance).toStrictEqual(balance);
    }
  });
});
