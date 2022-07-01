import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import BalanceFetcher from "./balance.fetcher";
import { BALANCE_IFACE } from "./utils";

//Data used for tests [blockNumber, balance]
const TEST_DATA: [number, BigNumber][] = [
  [10, BigNumber.from(70)],
  [20, BigNumber.from(100)],
  [30, BigNumber.from(100)],
  [40, BigNumber.from(120)],
  [50, BigNumber.from(240)],
];

const safetyContract = createAddress("0xa1");
const stakedToken = createAddress("0xa2");

describe("BalanceFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager = {
    dydxAddress: stakedToken,
    safetyModule: safetyContract,
  };
  const fetcher: BalanceFetcher = new BalanceFetcher(mockProvider as any, mockNetworkManager as any);

  beforeAll(() => {
    for (let [block, balance] of TEST_DATA) {
      mockProvider.addCallTo(stakedToken, block, BALANCE_IFACE, "balanceOf", {
        inputs: [safetyContract],
        outputs: [balance],
      });
    }
  });

  it("should fetch balance and use cache correctly", async () => {
    for (let [block, balance] of TEST_DATA) {
      const fetchedBalance = await fetcher.getBalance(block);
      expect(fetchedBalance).toStrictEqual(balance);
    }

    // clear mock to use cache
    mockProvider.clear();
    for (let [block, balance] of TEST_DATA) {
      const fetchedBalance = await fetcher.getBalance(block);
      expect(fetchedBalance).toStrictEqual(balance);
    }
  });
});
