import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import NetworkManager from "./network";
import BalanceFetcher from "./balance.fetcher";
import { IMPLEMENTATION_IFACE } from "./utils";

describe("Balance Fetcher test suite", () => {
  // Format: [totalBorrowerDebtBalance, totalActiveBalanceCurrentEpoch, blockNumber]
  const TEST_CASES: [BigNumber, BigNumber, number][] = [
    [BigNumber.from("10"), BigNumber.from("80"), 1],
    [BigNumber.from("20"), BigNumber.from("85"), 2],
    [BigNumber.from("30"), BigNumber.from("90"), 3],
    [BigNumber.from("40"), BigNumber.from("95"), 4],
  ];

  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager: NetworkManager = {
    liquidityModule: createAddress("0xab"),
    networkMap: {},
    setNetwork: jest.fn(),
  };
  const fetcher: BalanceFetcher = new BalanceFetcher(mockProvider as any, mockNetworkManager);

  function createGetTotalBorrowerDebtBalance(totalBorrowerDebtBalance: BigNumber, blockNumber: number) {
    return mockProvider.addCallTo(
      mockNetworkManager.liquidityModule,
      blockNumber,
      IMPLEMENTATION_IFACE,
      "getTotalBorrowerDebtBalance",
      {
        inputs: [],
        outputs: [totalBorrowerDebtBalance],
      }
    );
  }

  function createGetTotalActiveBalanceCurrentEpoch(totalActiveBalanceCurrentEpoch: BigNumber, blockNumber: number) {
    return mockProvider.addCallTo(
      mockNetworkManager.liquidityModule,
      blockNumber,
      IMPLEMENTATION_IFACE,
      "getTotalActiveBalanceCurrentEpoch",
      {
        inputs: [],
        outputs: [totalActiveBalanceCurrentEpoch],
      }
    );
  }

  beforeEach(() => mockProvider.clear());

  it("should store correct total borrower debt balance amount", async () => {
    for (let [totalBorrowerDebtBalance, , blockNumber] of TEST_CASES) {
      createGetTotalBorrowerDebtBalance(totalBorrowerDebtBalance, blockNumber);

      const fetchedDebtBalance: BigNumber = await fetcher.getTotalBorrowerDebtBalance(blockNumber);
      expect(fetchedDebtBalance).toStrictEqual(totalBorrowerDebtBalance);
    }

    // clear mock to use cache
    mockProvider.clear();
    for (let [totalBorrowerDebtBalance, , blockNumber] of TEST_CASES) {
      const fetchedDebtBalance: BigNumber = await fetcher.getTotalBorrowerDebtBalance(blockNumber);
      expect(fetchedDebtBalance).toStrictEqual(totalBorrowerDebtBalance);
    }
  });

  it("should store correct total active balance current epoch amount", async () => {
    for (let [, totalActiveBalanceCurrentEpoch, blockNumber] of TEST_CASES) {
      createGetTotalActiveBalanceCurrentEpoch(totalActiveBalanceCurrentEpoch, blockNumber);

      const fetchedActiveBalance: BigNumber = await fetcher.getTotalActiveBalanceCurrentEpoch(blockNumber);
      expect(fetchedActiveBalance).toStrictEqual(totalActiveBalanceCurrentEpoch);
    }

    // clear mock to use cache
    mockProvider.clear();
    for (let [, totalActiveBalanceCurrentEpoch, blockNumber] of TEST_CASES) {
      const fetchedActiveBalance: BigNumber = await fetcher.getTotalActiveBalanceCurrentEpoch(blockNumber);
      expect(fetchedActiveBalance).toStrictEqual(totalActiveBalanceCurrentEpoch);
    }
  });
});
