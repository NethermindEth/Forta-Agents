import { BlockEvent, Finding, HandleBlock } from "forta-agent";
import {
  getNumberOfDays,
  getAverageBlockTime,
  getEstimatedNumberOfBlocksUntilMerge,
  getAvgBlockDifficulty,
} from "./utils";
import { TERMINAL_TOTAL_DIFFICULTY, MILESTONES, ETH_BLOCK_DATA } from "./eth.config";
import { createFinding, createFinalFinding } from "./findings";
import BigNumber from "bignumber.js";

let blockCounter: number = 0;
let firstTimestamp: number = 0;

const avgBlockDifficulties: BigNumber[] = [];

let isEmitted: { [key: string]: any } = {
  low: false,
  medium: false,
  high: false,
  critical: {
    5: false,
    4: false,
    3: false,
    2: false,
    1: false,
  },
};

let isMerged: boolean = false;

export const provideHandleBlock = (ttd: BigNumber, ethBlockData: any, blockCounter: number): HandleBlock => {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const totalDifficulty = new BigNumber(blockEvent.block.totalDifficulty);

    if (totalDifficulty.lt(ttd)) {
      blockCounter++;

      const blockDifficulty = new BigNumber(blockEvent.block.difficulty);

      avgBlockDifficulties.push(blockDifficulty);

      // Save the first timestamp to be used for calculation of average block time.
      if (!firstTimestamp) {
        firstTimestamp = blockEvent.block.timestamp;
      }

      const currentBlockTimestamp = blockEvent.block.timestamp;

      /*
        In order to avoid false positives for the average block time, `avgBlockTime` includes
        the count of total blocks and average block time in a week.
        Then it continues to calculate `avgBlockTime` along with the new data feed.
      */
      const avgBlockTime = getAverageBlockTime(ethBlockData, currentBlockTimestamp, firstTimestamp, blockCounter);

      const avgBlockDifficulty = getAvgBlockDifficulty(avgBlockDifficulties);

      const estimatedNumberOfBlocksUntilMerge = getEstimatedNumberOfBlocksUntilMerge(
        ttd,
        totalDifficulty,
        avgBlockDifficulty
      );

      const { diffInDays: estimatedNumberOfDaysUntilMerge, estimatedMergeDate } = getNumberOfDays(
        avgBlockTime,
        estimatedNumberOfBlocksUntilMerge
      );

      const mergeInfo = {
        estimatedNumberOfDaysUntilMerge,
        estimatedMergeDate,
        latestTotalDifficulty: totalDifficulty.toString(10),
        remainingDifficulty: ttd.minus(totalDifficulty).toString(10),
      };

      /*
        Check if number of days until merge is between 20-15, 15-10, 10-5.
        Create one time alert for each gap. But if it's between 5-0, create one time alert for each day.
      */
      if (
        estimatedNumberOfDaysUntilMerge <= MILESTONES.CRITICAL &&
        estimatedNumberOfDaysUntilMerge > 0 &&
        !isEmitted.critical[estimatedNumberOfDaysUntilMerge]
      ) {
        findings.push(createFinding(mergeInfo));
        isEmitted.critical[estimatedNumberOfDaysUntilMerge] = true;
      } else if (
        estimatedNumberOfDaysUntilMerge <= MILESTONES.HIGH &&
        estimatedNumberOfDaysUntilMerge > MILESTONES.CRITICAL &&
        !isEmitted.high
      ) {
        findings.push(createFinding(mergeInfo));
        isEmitted.high = true;
      } else if (
        estimatedNumberOfDaysUntilMerge <= MILESTONES.MEDIUM &&
        estimatedNumberOfDaysUntilMerge > MILESTONES.HIGH &&
        !isEmitted.medium
      ) {
        findings.push(createFinding(mergeInfo));
        isEmitted.medium = true;
      } else if (
        estimatedNumberOfDaysUntilMerge <= MILESTONES.LOW &&
        estimatedNumberOfDaysUntilMerge > MILESTONES.MEDIUM &&
        !isEmitted.low
      ) {
        findings.push(createFinding(mergeInfo));
        isEmitted.low = true;
      }
    } else if (totalDifficulty.gte(ttd) && !isMerged) {
      findings.push(createFinalFinding(totalDifficulty.toString(10)));
      isMerged = true;
    }
    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(TERMINAL_TOTAL_DIFFICULTY, ETH_BLOCK_DATA, blockCounter),
};
