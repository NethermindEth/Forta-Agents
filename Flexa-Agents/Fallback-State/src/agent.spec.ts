import { HandleBlock, Finding, FindingSeverity, FindingType } from "forta-agent";
import { provideHandleBlock } from "./agent";
import { TestBlockEvent, createAddress } from "forta-agent-tools";
import { when, resetAllWhenMocks } from "jest-when";

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
    protocol: "Flexa",
    metadata: {
      blockTimestamp: timestamp.toString(),
      blockNumber: blockNumber.toString()
    }
  });
};

describe("Flexa Staking Contract Fallback State Tests", () => {
  let handleBlock: HandleBlock;

  beforeEach(() => {
    resetAllWhenMocks();

    handleBlock = provideHandleBlock(mockFetcher as any, factory);
  });

  it("should return empty finding if contract isn't in fallback state", async () => {
    // set mock values
    when(mockFetcher.getFallbackSetDate).calledWith(testBlockNumber[1], factory).mockReturnValue(252525);
    when(mockFetcher.getFallbackWithdrawalDelaySeconds).calledWith(testBlockNumber[1], factory).mockReturnValue(262626);

    const blockEvent = new TestBlockEvent().setTimestamp(testBlockTimestamp[0]).setNumber(testBlockNumber[1]);
    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });
});
