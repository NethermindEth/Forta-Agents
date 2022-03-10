import DataFetcher from "./data.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { flexaInterface } from "./abi";
import { BigNumber } from "ethers";

describe("DataFetcher tests suite", () => {
  // format: [flexaAddress, blockNumber, fallbackSetDate, fallbackWithdrawalDelaySecondsCall]
  const TEST_CASES: [string, number, number, number][] = [
    [createAddress("0xf33d4"), 2200000, 1500000, 35000],
    [createAddress("0xdef1"), 2250000, 1550000, 36000],
    [createAddress("0xb33f"), 2300000, 1600000, 37000],
    [createAddress("0xf00b4"), 2350000, 1650000, 38000]
  ];

  // format: [blockNumber, newBlock]
  const TEST_CASE_PROVIDER: [number, any] = [14000000, { timestamp: 1646000000 }];

  const mockProvider: MockEthersProvider = new MockEthersProvider();

  function createMockFallbackSetDateCall(blockNumber: number, flexaAddress: string, fallbackSetDateCall: number) {
    return mockProvider.addCallTo(flexaAddress, blockNumber, flexaInterface, "fallbackSetDate", {
      inputs: [],
      outputs: [fallbackSetDateCall]
    });
  }

  function createMockFallbackWithdrawalDelaySecondsCall(
    blockNumber: number,
    flexaAddress: string,
    fallbackWithdrawalDelaySecondsCall: number
  ) {
    return mockProvider.addCallTo(flexaAddress, blockNumber, flexaInterface, "fallbackWithdrawalDelaySeconds", {
      inputs: [],
      outputs: [fallbackWithdrawalDelaySecondsCall]
    });
  }

  function createMockPreviousBlockTimestampCall(blockNumber: number, newBlock: number) {
    return mockProvider.addBlock(blockNumber, newBlock);
  }

  beforeEach(() => mockProvider.clear());

  it("should store the correct contract address", () => {
    for (let [flexaAddress] of TEST_CASES) {
      const fetcher: DataFetcher = new DataFetcher(flexaAddress, mockProvider as any);
      expect(fetcher.flexaAddress).toStrictEqual(flexaAddress);
    }
  });

  it("should return the correct Fallback Set Date", async () => {
    for (let [flexaAddress, blockNumber, fallbackSetDateCall] of TEST_CASES) {
      const fetcher: DataFetcher = new DataFetcher(flexaAddress, mockProvider as any);
      createMockFallbackSetDateCall(blockNumber, flexaAddress, fallbackSetDateCall);

      const fetchedFallbackSetDateCall: BigNumber = await fetcher.getFallbackSetDate(blockNumber);
      expect(fetchedFallbackSetDateCall).toStrictEqual(BigNumber.from(fallbackSetDateCall));
    }
  });

  it("should return the correct Fallback Withdrawal Delay Seconds", async () => {
    for (let [flexaAddress, blockNumber, fallbackSetDateCall, fallbackWithdrawalDelaySecondsCall] of TEST_CASES) {
      const fetcher: DataFetcher = new DataFetcher(flexaAddress, mockProvider as any);
      createMockFallbackWithdrawalDelaySecondsCall(blockNumber, flexaAddress, fallbackWithdrawalDelaySecondsCall);

      const fetchedFallbackWithdrawalDelaySecondsCall: BigNumber = await fetcher.getFallbackWithdrawalDelaySeconds(
        blockNumber
      );
      expect(fetchedFallbackWithdrawalDelaySecondsCall).toStrictEqual(
        BigNumber.from(fallbackWithdrawalDelaySecondsCall)
      );
    }
  });

  it("should return the correct Previous Block Timestamp", async () => {
    createMockPreviousBlockTimestampCall(TEST_CASE_PROVIDER[0], TEST_CASE_PROVIDER[1]);
    const previousBlockTimestamp = mockProvider.getBlock(TEST_CASE_PROVIDER[0]).timestamp;

    expect(previousBlockTimestamp).toStrictEqual(1646000000);
  });
});
