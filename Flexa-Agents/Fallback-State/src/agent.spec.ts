import { HandleBlock, Finding, FindingSeverity, FindingType } from "forta-agent";
import { provideHandleBlock } from "./agent";
import { TestBlockEvent } from "forta-agent-tools/lib/tests.utils";
import { when, resetAllWhenMocks } from "jest-when";
import { BigNumber } from "ethers";

const mockFetcher = {
  getFallbackSetDate: jest.fn(),
  getFallbackWithdrawalDelaySeconds: jest.fn(),
  getBlockTimestamp: jest.fn()
};

const testBlockNumbers: number[] = [14306500, 14306501];
const testFallbackSetDates: number[] = [1500000000, 1600000000];
const testFallbackWithdrawalDelaySeconds: number = 3900000;
const testBlockTimestamp: number = 1600000009;
const testPreviousBlockTimestamp: number = 1600000000;

const createFinding = () => {
  return Finding.fromObject({
    name: "Contract Fallback State alert",
    description: "Contract has entered fallback mode",
    alertId: "FLEXA-5",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Flexa"
  });
};

describe("Flexa Staking Contract Fallback State Tests", () => {
  let handleBlock: HandleBlock;

  beforeEach(() => {
    resetAllWhenMocks();

    handleBlock = provideHandleBlock(mockFetcher as any);
  });

  it("should return empty finding if contract isn't in fallback state", async () => {
    when(mockFetcher.getFallbackSetDate)
      .calledWith(testBlockNumbers[1])
      .mockReturnValue(BigNumber.from(testFallbackSetDates[1]));
    when(mockFetcher.getFallbackWithdrawalDelaySeconds)
      .calledWith(testBlockNumbers[1])
      .mockReturnValue(BigNumber.from(testFallbackWithdrawalDelaySeconds));

    const blockEvent = new TestBlockEvent().setTimestamp(testBlockTimestamp).setNumber(testBlockNumbers[1]);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty finding if contract is in fallback state in the last two blocks", async () => {
    when(mockFetcher.getFallbackSetDate)
      .calledWith(testBlockNumbers[1])
      .mockReturnValue(BigNumber.from(testFallbackSetDates[0]));
    when(mockFetcher.getFallbackSetDate)
      .calledWith(testBlockNumbers[0])
      .mockReturnValue(BigNumber.from(testFallbackSetDates[0]));
    when(mockFetcher.getFallbackWithdrawalDelaySeconds)
      .calledWith(testBlockNumbers[1])
      .mockReturnValue(BigNumber.from(testFallbackWithdrawalDelaySeconds));
    when(mockFetcher.getFallbackWithdrawalDelaySeconds)
      .calledWith(testBlockNumbers[0])
      .mockReturnValue(BigNumber.from(testFallbackWithdrawalDelaySeconds));
    when(mockFetcher.getBlockTimestamp).calledWith(testBlockNumbers[0]).mockReturnValue(testPreviousBlockTimestamp);

    const blockEvent = new TestBlockEvent().setTimestamp(testBlockTimestamp).setNumber(testBlockNumbers[1]);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if contract is in fallback state only in the last block", async () => {
    when(mockFetcher.getFallbackSetDate)
      .calledWith(testBlockNumbers[1])
      .mockReturnValue(BigNumber.from(testFallbackSetDates[0]));
    when(mockFetcher.getFallbackSetDate)
      .calledWith(testBlockNumbers[0])
      .mockReturnValue(BigNumber.from(testFallbackSetDates[1]));
    when(mockFetcher.getFallbackWithdrawalDelaySeconds)
      .calledWith(testBlockNumbers[1])
      .mockReturnValue(BigNumber.from(testFallbackWithdrawalDelaySeconds));
    when(mockFetcher.getFallbackWithdrawalDelaySeconds)
      .calledWith(testBlockNumbers[0])
      .mockReturnValue(BigNumber.from(testFallbackWithdrawalDelaySeconds));
    when(mockFetcher.getBlockTimestamp).calledWith(testBlockNumbers[0]).mockReturnValue(testPreviousBlockTimestamp);

    const blockEvent = new TestBlockEvent().setTimestamp(testBlockTimestamp).setNumber(testBlockNumbers[1]);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding()]);
  });
});
