import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import NetworkManager from "./network";
import BalanceFetcher from "./balance.fetcher";
import { USDC_IFACE } from "./utils";

describe("Balance Fetcher test suite", () => {
  // Format: [moduleAddress, moduleTokenAmount, blockNumber]
  const TEST_CASES: [string, BigNumber, number][] = [
    [createAddress("0x1"), BigNumber.from("10"), 1],
    [createAddress("0x2"), BigNumber.from("20"), 2],
    [createAddress("0x3"), BigNumber.from("30"), 3],
    [createAddress("0x4"), BigNumber.from("40"), 4],
  ];
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager: NetworkManager = {
    liquidityModule: createAddress("0xab"),
    usdcAddress: createAddress("0xac"),
    networkMap: {},
    setNetwork: jest.fn(),
  };
  const fetcher: BalanceFetcher = new BalanceFetcher(mockProvider as any, mockNetworkManager);

  function createBalanceOfCall(moduleAddress: string, tokenAmount: BigNumber, blockNumber: number) {
    return mockProvider.addCallTo(mockNetworkManager.usdcAddress, blockNumber, USDC_IFACE, "balanceOf", {
      inputs: [moduleAddress],
      outputs: [tokenAmount],
    });
  }

  beforeEach(() => mockProvider.clear());

  it("should store correct stake token amount of module address", async () => {
    for (let [moduleAddress, moduleStakeTokenAmount, blockNumber] of TEST_CASES) {
      createBalanceOfCall(moduleAddress, moduleStakeTokenAmount, blockNumber);

      const fetchedTokenAmount: BigNumber = await fetcher.getBalanceOf(moduleAddress, blockNumber);
      expect(fetchedTokenAmount).toStrictEqual(moduleStakeTokenAmount);
    }

    // clear mock to use cache
    mockProvider.clear();
    for (let [moduleAddress, moduleStakeTokenAmount, blockNumber] of TEST_CASES) {
      const fetchedTokenAmount: BigNumber = await fetcher.getBalanceOf(moduleAddress, blockNumber);
      expect(fetchedTokenAmount).toStrictEqual(moduleStakeTokenAmount);
    }
  });
});
