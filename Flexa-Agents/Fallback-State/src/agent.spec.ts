import { HandleBlock, Finding, FindingSeverity, FindingType } from "forta-agent";
import { provideHandleBlock } from "./agent";
import { TestBlockEvent, createAddress } from "forta-agent-tools/lib/tests.utils";
import { when, resetAllWhenMocks } from "jest-when";
import { BigNumber } from "ethers";

const factory: string = createAddress("0xa0");

const mockFetcher = {
  getFallbackSetDate: jest.fn(),
  getFallbackWithdrawalDelaySeconds: jest.fn(),
  getPreviousBlockTimestamp: jest.fn()
};

const testBlockNumber: number[] = [14306500, 14306501];
const testFallbackSetDate: number[] = [1500000000, 1600000000];
const testFallbackWithdrawalDelaySeconds: number = 3900000;
const testBlockTimestamp: number = 1600000009;
const testPreviousBlockTimestamp: number = 1600000000;

const createFinding = (timestamp: number, blockNumber: number) => {
  return Finding.fromObject({
    name: "Contract Fallback State alert",
    description: "Contract has entered fallback mode",
    alertId: "FLEXA-4",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Flexa"
  });
};

describe("Flexa Staking Contract Fallback State Tests", () => {
  let handleBlock: HandleBlock;

  beforeEach(() => {
    resetAllWhenMocks();

    handleBlock = provideHandleBlock(mockFetcher as any, factory);
  });

  it("should return empty finding if contract isn't in fallback state", async () => {
    when(mockFetcher.getFallbackSetDate)
      .calledWith(testBlockNumber[1], factory)
      .mockReturnValue(BigNumber.from(testFallbackSetDate[1]));
    when(mockFetcher.getFallbackWithdrawalDelaySeconds)
      .calledWith(testBlockNumber[1], factory)
      .mockReturnValue(BigNumber.from(testFallbackWithdrawalDelaySeconds));

    const blockEvent = new TestBlockEvent().setTimestamp(testBlockTimestamp).setNumber(testBlockNumber[1]);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty finding if contract is in fallback state in the last two blocks", async () => {
    when(mockFetcher.getFallbackSetDate)
      .calledWith(testBlockNumber[1], factory)
      .mockReturnValue(BigNumber.from(testFallbackSetDate[0]));
    when(mockFetcher.getFallbackSetDate)
      .calledWith(testBlockNumber[0], factory)
      .mockReturnValue(BigNumber.from(testFallbackSetDate[0]));
    when(mockFetcher.getFallbackWithdrawalDelaySeconds)
      .calledWith(testBlockNumber[1], factory)
      .mockReturnValue(BigNumber.from(testFallbackWithdrawalDelaySeconds));
    when(mockFetcher.getFallbackWithdrawalDelaySeconds)
      .calledWith(testBlockNumber[0], factory)
      .mockReturnValue(BigNumber.from(testFallbackWithdrawalDelaySeconds));
    when(mockFetcher.getPreviousBlockTimestamp)
      .calledWith(testBlockNumber[1])
      .mockReturnValue(testPreviousBlockTimestamp);

    const blockEvent = new TestBlockEvent().setTimestamp(testBlockTimestamp).setNumber(testBlockNumber[1]);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if contract is in fallback state only in the last block", async () => {
    when(mockFetcher.getFallbackSetDate)
      .calledWith(testBlockNumber[1], factory)
      .mockReturnValue(BigNumber.from(testFallbackSetDate[0]));
    when(mockFetcher.getFallbackSetDate)
      .calledWith(testBlockNumber[0], factory)
      .mockReturnValue(BigNumber.from(testFallbackSetDate[1]));
    when(mockFetcher.getFallbackWithdrawalDelaySeconds)
      .calledWith(testBlockNumber[1], factory)
      .mockReturnValue(BigNumber.from(testFallbackWithdrawalDelaySeconds));
    when(mockFetcher.getFallbackWithdrawalDelaySeconds)
      .calledWith(testBlockNumber[0], factory)
      .mockReturnValue(BigNumber.from(testFallbackWithdrawalDelaySeconds));
    when(mockFetcher.getPreviousBlockTimestamp)
      .calledWith(testBlockNumber[1])
      .mockReturnValue(testPreviousBlockTimestamp);

    const blockEvent = new TestBlockEvent().setTimestamp(testBlockTimestamp).setNumber(testBlockNumber[1]);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(testBlockTimestamp, testBlockNumber[1])]);
  });

  it("should return empty finding if a different contract is in fallback state", async () => {
    when(mockFetcher.getFallbackSetDate)
      .calledWith(testBlockNumber[1], createAddress("0xd4"))
      .mockReturnValue(testFallbackSetDate[0]);
    when(mockFetcher.getFallbackSetDate)
      .calledWith(testBlockNumber[0], createAddress("0xd4"))
      .mockReturnValue(testFallbackSetDate[1]);
    when(mockFetcher.getFallbackWithdrawalDelaySeconds)
      .calledWith(testBlockNumber[1], createAddress("0xd4"))
      .mockReturnValue(testFallbackWithdrawalDelaySeconds);
    when(mockFetcher.getFallbackWithdrawalDelaySeconds)
      .calledWith(testBlockNumber[0], createAddress("0xd4"))
      .mockReturnValue(testFallbackWithdrawalDelaySeconds);
    when(mockFetcher.getPreviousBlockTimestamp)
      .calledWith(testBlockNumber[1])
      .mockReturnValue(testPreviousBlockTimestamp);

    const blockEvent = new TestBlockEvent().setTimestamp(testBlockTimestamp).setNumber(testBlockNumber[1]);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });
});
