import { createAddress } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { when, resetAllWhenMocks } from "jest-when";
import BalanceFetcher from "./balance.fetcher";
import { IMPLEMENTATION_IFACE } from "./utils";

describe("Balance Fetcher test suite", () => {
  const testProxyAddress: string = createAddress("0xab");
  // Format: [totalBorrowerDebtBalance, totalActiveBalanceCurrentEpoch, blockNumber]
  const TEST_CASES: [BigNumber, BigNumber, number][] = [
    [BigNumber.from("10"), BigNumber.from("80"), 1],
    [BigNumber.from("20"), BigNumber.from("85"), 2],
    [BigNumber.from("30"), BigNumber.from("90"), 3],
    [BigNumber.from("40"), BigNumber.from("95"), 4],
  ];

  const mockProvider: any = {
    call: jest.fn(),
  };
  const fetcher: BalanceFetcher = new BalanceFetcher(mockProvider as any, testProxyAddress);

  function createGetTotalBorrowerDebtBalance(totalBorrowerDebtBalance: BigNumber) {
    when(mockProvider.call)
      .calledWith(
        { to: testProxyAddress, data: IMPLEMENTATION_IFACE.getSighash("getTotalBorrowerDebtBalance") },
        "latest"
      )
      .mockReturnValue(totalBorrowerDebtBalance);
  }

  function createGetTotalActiveBalanceCurrentEpoch(totalActiveBalanceCurrentEpoch: BigNumber) {
    when(mockProvider.call)
      .calledWith(
        { to: testProxyAddress, data: IMPLEMENTATION_IFACE.getSighash("getTotalActiveBalanceCurrentEpoch") },
        "latest"
      )
      .mockReturnValue(totalActiveBalanceCurrentEpoch);
  }

  beforeEach(() => resetAllWhenMocks());

  it("should store correct total borrower debt balance amount", async () => {
    for (let [totalBorrowerDebtBalance, , blockNumber] of TEST_CASES) {
      createGetTotalBorrowerDebtBalance(totalBorrowerDebtBalance);

      const fetchedDebtBalance: BigNumber = await fetcher.getTotalBorrowerDebtBalance(blockNumber);
      expect(fetchedDebtBalance).toStrictEqual(totalBorrowerDebtBalance);
    }

    // clear mock to use cache
    resetAllWhenMocks();
    for (let [totalBorrowerDebtBalance, , blockNumber] of TEST_CASES) {
      createGetTotalBorrowerDebtBalance(totalBorrowerDebtBalance);

      const fetchedDebtBalance: BigNumber = await fetcher.getTotalBorrowerDebtBalance(blockNumber);
      expect(fetchedDebtBalance).toStrictEqual(totalBorrowerDebtBalance);
    }
  });

  it("should store correct total active balance current epoch amount", async () => {
    for (let [, totalActiveBalanceCurrentEpoch, blockNumber] of TEST_CASES) {
      createGetTotalActiveBalanceCurrentEpoch(totalActiveBalanceCurrentEpoch);

      const fetchedActiveBalance: BigNumber = await fetcher.getTotalActiveBalanceCurrentEpoch(blockNumber);
      expect(fetchedActiveBalance).toStrictEqual(totalActiveBalanceCurrentEpoch);
    }

    // clear mock to use cache
    resetAllWhenMocks();
    for (let [, totalActiveBalanceCurrentEpoch, blockNumber] of TEST_CASES) {
      createGetTotalActiveBalanceCurrentEpoch(totalActiveBalanceCurrentEpoch);

      const fetchedActiveBalance: BigNumber = await fetcher.getTotalActiveBalanceCurrentEpoch(blockNumber);
      expect(fetchedActiveBalance).toStrictEqual(totalActiveBalanceCurrentEpoch);
    }
  });
});
