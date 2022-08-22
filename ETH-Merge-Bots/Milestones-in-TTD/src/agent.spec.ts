import { BlockEvent, HandleBlock } from "forta-agent";
import { TestBlockEvent } from "forta-agent-tools/lib/test";
import { provideHandleBlock } from "./agent";
import BigNumber from "bignumber.js";
import { createFinding, createFinalFinding } from "./findings";
import { getNumberOfDays, getAverageBlockTime, getEstimatedNumberOfBlocksUntilMerge } from "./utils";

const TERMINAL_TOTAL_DIFFICULTY = new BigNumber("10000000");
const blockCounter = 0;

export const ETH_BLOCK_DATA = {
  avgBlockTime: 10,
  blockNumberAWeek: 10000,
};

const createMergeInfo = (
  estimatedNumberOfDaysUntilMerge: number,
  estimatedMergeDate: Date,
  latestTotalDifficulty: string
) => {
  return {
    estimatedNumberOfDaysUntilMerge,
    estimatedMergeDate,
    latestTotalDifficulty,
    remainingDifficulty: TERMINAL_TOTAL_DIFFICULTY.minus(latestTotalDifficulty).toString(10),
  };
};

describe("Milestones in Terminal Total Difficulty Bot", () => {
  let handleBlock: HandleBlock;
  let blockEvent: BlockEvent;
  let avgBlockTime: number;

  beforeEach(async () => {
    handleBlock = provideHandleBlock(TERMINAL_TOTAL_DIFFICULTY, ETH_BLOCK_DATA, blockCounter);
    blockEvent = new TestBlockEvent().setTimestamp(0);
    blockEvent.block.difficulty = new BigNumber("10").toString();
    avgBlockTime = getAverageBlockTime(ETH_BLOCK_DATA, blockEvent.block.timestamp, 0, 1);
  });

  it("it should not emit findings when there are more than 20 days until merge", async () => {
    blockEvent.block.totalDifficulty = new BigNumber("8200000").toString();

    const findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should emit 1 finding when there are less than 20 days and more than 15 days until merge", async () => {
    blockEvent.block.totalDifficulty = new BigNumber("8300000").toString();

    let findings = await handleBlock(blockEvent);

    const estimatedNumberOfBlocksUntilMerge = getEstimatedNumberOfBlocksUntilMerge(
      TERMINAL_TOTAL_DIFFICULTY,
      new BigNumber(blockEvent.block.totalDifficulty),
      new BigNumber(blockEvent.block.difficulty)
    );

    const { diffInDays: estimatedNumberOfDaysUntilMerge, estimatedMergeDate } = getNumberOfDays(
      avgBlockTime,
      estimatedNumberOfBlocksUntilMerge
    );

    const mergeInfo = createMergeInfo(
      estimatedNumberOfDaysUntilMerge,
      estimatedMergeDate,
      blockEvent.block.totalDifficulty
    );

    expect(estimatedNumberOfDaysUntilMerge).toStrictEqual(20);
    expect(findings).toStrictEqual([createFinding(mergeInfo)]);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should emit 1 finding when there are less than 15 days and more than 10 days until merge", async () => {
    blockEvent.block.totalDifficulty = new BigNumber("8750000").toString();

    let findings = await handleBlock(blockEvent);

    const estimatedNumberOfBlocksUntilMerge = getEstimatedNumberOfBlocksUntilMerge(
      TERMINAL_TOTAL_DIFFICULTY,
      new BigNumber(blockEvent.block.totalDifficulty),
      new BigNumber(blockEvent.block.difficulty)
    );

    const { diffInDays: estimatedNumberOfDaysUntilMerge, estimatedMergeDate } = getNumberOfDays(
      avgBlockTime,
      estimatedNumberOfBlocksUntilMerge
    );

    const mergeInfo = createMergeInfo(
      estimatedNumberOfDaysUntilMerge,
      estimatedMergeDate,
      blockEvent.block.totalDifficulty
    );

    expect(estimatedNumberOfDaysUntilMerge).toStrictEqual(15);
    expect(findings).toStrictEqual([createFinding(mergeInfo)]);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should emit 1 finding when there are less than 10 days and more than 5 days until merge", async () => {
    blockEvent.block.totalDifficulty = new BigNumber("9150000").toString();

    let findings = await handleBlock(blockEvent);

    const estimatedNumberOfBlocksUntilMerge = getEstimatedNumberOfBlocksUntilMerge(
      TERMINAL_TOTAL_DIFFICULTY,
      new BigNumber(blockEvent.block.totalDifficulty),
      new BigNumber(blockEvent.block.difficulty)
    );

    const { diffInDays: estimatedNumberOfDaysUntilMerge, estimatedMergeDate } = getNumberOfDays(
      avgBlockTime,
      estimatedNumberOfBlocksUntilMerge
    );

    const mergeInfo = createMergeInfo(
      estimatedNumberOfDaysUntilMerge,
      estimatedMergeDate,
      blockEvent.block.totalDifficulty
    );

    expect(estimatedNumberOfDaysUntilMerge).toStrictEqual(10);
    expect(findings).toStrictEqual([createFinding(mergeInfo)]);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should emit a finding for each day when there are less than 5 days until merge", async () => {
    // 5 days left
    blockEvent.block.totalDifficulty = new BigNumber("9650000").toString();

    let findings = await handleBlock(blockEvent);

    let estimatedNumberOfBlocksUntilMerge = getEstimatedNumberOfBlocksUntilMerge(
      TERMINAL_TOTAL_DIFFICULTY,
      new BigNumber(blockEvent.block.totalDifficulty),
      new BigNumber(blockEvent.block.difficulty)
    );

    const { diffInDays: numberOfDaysUntilMerge1, estimatedMergeDate: mergeDate1 } = getNumberOfDays(
      avgBlockTime,
      estimatedNumberOfBlocksUntilMerge
    );

    let mergeInfo = createMergeInfo(numberOfDaysUntilMerge1, mergeDate1, blockEvent.block.totalDifficulty);

    expect(numberOfDaysUntilMerge1).toStrictEqual(5);
    expect(findings).toStrictEqual([createFinding(mergeInfo)]);

    // 4 days left
    blockEvent.block.totalDifficulty = new BigNumber("9700000").toString();
    findings = await handleBlock(blockEvent);

    estimatedNumberOfBlocksUntilMerge = getEstimatedNumberOfBlocksUntilMerge(
      TERMINAL_TOTAL_DIFFICULTY,
      new BigNumber(blockEvent.block.totalDifficulty),
      new BigNumber(blockEvent.block.difficulty)
    );

    avgBlockTime = getAverageBlockTime(ETH_BLOCK_DATA, blockEvent.block.timestamp, 0, 2);

    const { diffInDays: numberOfDaysUntilMerge2, estimatedMergeDate: mergeDate2 } = getNumberOfDays(
      avgBlockTime,
      estimatedNumberOfBlocksUntilMerge
    );

    mergeInfo = createMergeInfo(numberOfDaysUntilMerge2, mergeDate2, blockEvent.block.totalDifficulty);

    expect(numberOfDaysUntilMerge2).toStrictEqual(4);
    expect(findings).toStrictEqual([createFinding(mergeInfo)]);

    // 3 days left
    blockEvent.block.totalDifficulty = new BigNumber("9800000").toString();
    findings = await handleBlock(blockEvent);

    estimatedNumberOfBlocksUntilMerge = getEstimatedNumberOfBlocksUntilMerge(
      TERMINAL_TOTAL_DIFFICULTY,
      new BigNumber(blockEvent.block.totalDifficulty),
      new BigNumber(blockEvent.block.difficulty)
    );

    avgBlockTime = getAverageBlockTime(ETH_BLOCK_DATA, blockEvent.block.timestamp, 0, 3);

    const { diffInDays: numberOfDaysUntilMerge3, estimatedMergeDate: mergeDate3 } = getNumberOfDays(
      avgBlockTime,
      estimatedNumberOfBlocksUntilMerge
    );

    mergeInfo = createMergeInfo(numberOfDaysUntilMerge3, mergeDate3, blockEvent.block.totalDifficulty);

    expect(numberOfDaysUntilMerge3).toStrictEqual(3);
    expect(findings).toStrictEqual([createFinding(mergeInfo)]);

    // 2 days left
    blockEvent.block.totalDifficulty = new BigNumber("9900000").toString();
    findings = await handleBlock(blockEvent);

    estimatedNumberOfBlocksUntilMerge = getEstimatedNumberOfBlocksUntilMerge(
      TERMINAL_TOTAL_DIFFICULTY,
      new BigNumber(blockEvent.block.totalDifficulty),
      new BigNumber(blockEvent.block.difficulty)
    );

    avgBlockTime = getAverageBlockTime(ETH_BLOCK_DATA, blockEvent.block.timestamp, 0, 4);

    const { diffInDays: numberOfDaysUntilMerge4, estimatedMergeDate: mergeDate4 } = getNumberOfDays(
      avgBlockTime,
      estimatedNumberOfBlocksUntilMerge
    );

    mergeInfo = createMergeInfo(numberOfDaysUntilMerge4, mergeDate4, blockEvent.block.totalDifficulty);

    expect(numberOfDaysUntilMerge4).toStrictEqual(2);
    expect(findings).toStrictEqual([createFinding(mergeInfo)]);

    // 1 day left
    blockEvent.block.totalDifficulty = new BigNumber("9950000").toString();
    findings = await handleBlock(blockEvent);

    estimatedNumberOfBlocksUntilMerge = getEstimatedNumberOfBlocksUntilMerge(
      TERMINAL_TOTAL_DIFFICULTY,
      new BigNumber(blockEvent.block.totalDifficulty),
      new BigNumber(blockEvent.block.difficulty)
    );

    avgBlockTime = getAverageBlockTime(ETH_BLOCK_DATA, blockEvent.block.timestamp, 0, 5);

    const { diffInDays: numberOfDaysUntilMerge5, estimatedMergeDate: mergeDate5 } = getNumberOfDays(
      avgBlockTime,
      estimatedNumberOfBlocksUntilMerge
    );

    mergeInfo = createMergeInfo(numberOfDaysUntilMerge5, mergeDate5, blockEvent.block.totalDifficulty);

    expect(numberOfDaysUntilMerge5).toStrictEqual(1);
    expect(findings).toStrictEqual([createFinding(mergeInfo)]);
  });

  it("should emit 1 finding when totalDifficulty reaches TTD", async () => {
    blockEvent.block.totalDifficulty = TERMINAL_TOTAL_DIFFICULTY.toString(10);

    let findings = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinalFinding(blockEvent.block.totalDifficulty)]);

    findings = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });
});
