import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import BalanceFetcher from "./balance.fetcher";
import { USDC_IFACE } from "./utils";

describe("Balance Fetcher test suite", () => {
  const testTokenAddress: string = createAddress("0xab");
  // Format: [proxyAddress, proxyTokenAmount, blockNumber]
  const TEST_CASES: [string, BigNumber, number][] = [
    [createAddress("0x1"), BigNumber.from("10"), 1],
    [createAddress("0x2"), BigNumber.from("20"), 2],
    [createAddress("0x3"), BigNumber.from("30"), 3],
    [createAddress("0x4"), BigNumber.from("40"), 4],
  ];
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const fetcher: BalanceFetcher = new BalanceFetcher(mockProvider as any, testTokenAddress);

  function createBalanceOfCall(proxyAddress: string, tokenAmount: BigNumber, blockNumber: number) {
    return mockProvider.addCallTo(testTokenAddress, blockNumber, USDC_IFACE, "balanceOf", {
      inputs: [proxyAddress],
      outputs: [tokenAmount],
    });
  }

  beforeEach(() => mockProvider.clear());

  it("should store correct stake token amount of proxy address", async () => {
    for (let [proxyAddress, proxyStakeTokenAmount, blockNumber] of TEST_CASES) {
      createBalanceOfCall(proxyAddress, proxyStakeTokenAmount, blockNumber);

      const fetchedTokenAmount: BigNumber = await fetcher.getBalanceOf(proxyAddress, blockNumber);
      expect(fetchedTokenAmount).toStrictEqual(proxyStakeTokenAmount);
    }

    // clear mock to use cache
    mockProvider.clear();
    for (let [proxyAddress, proxyStakeTokenAmount, blockNumber] of TEST_CASES) {
      const fetchedTokenAmount: BigNumber = await fetcher.getBalanceOf(proxyAddress, blockNumber);
      expect(fetchedTokenAmount).toStrictEqual(proxyStakeTokenAmount);
    }
  });
});
