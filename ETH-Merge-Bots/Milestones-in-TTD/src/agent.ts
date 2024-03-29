import { BlockEvent, Finding, HandleBlock } from "forta-agent";
import {
  getNumberOfDays,
  getUpdatedBlockTime,
  getEstimatedNumberOfBlocksUntilMerge,
  getAvgBlockDifficulty,
} from "./utils";
import { TERMINAL_TOTAL_DIFFICULTY, MILESTONES, ETH_BLOCK_DATA } from "./eth.config";
import { createFinding, createFinalFinding } from "./findings";
import BigNumber from "bignumber.js";

let blockCounter: number = 0;
let firstTimestamp: number = 0;

const blockDifficulties: BigNumber[] = [];

let isEmitted: { [key: string]: any } = {
  past: false,
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

    const latestTotalDifficulty = new BigNumber(blockEvent.block.totalDifficulty);

    if (latestTotalDifficulty.lt(ttd)) {
      const blockDifficulty = new BigNumber(blockEvent.block.difficulty);

      blockDifficulties.push(blockDifficulty);

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
      const updatedBlockTime = getUpdatedBlockTime(ethBlockData, currentBlockTimestamp, firstTimestamp, blockCounter);

      const avgBlockDifficulty = getAvgBlockDifficulty(blockDifficulties);

      const estimatedNumberOfBlocksUntilMerge = getEstimatedNumberOfBlocksUntilMerge(
        ttd,
        latestTotalDifficulty,
        avgBlockDifficulty
      );

      const { diffInDays: estimatedNumberOfDaysUntilMerge, estimatedMergeDate } = getNumberOfDays(
        updatedBlockTime,
        estimatedNumberOfBlocksUntilMerge
      );

      const mergeInfo = {
        estimatedNumberOfDaysUntilMerge,
        estimatedMergeDate,
        latestTotalDifficulty: latestTotalDifficulty.toString(10),
        remainingDifficulty: ttd.minus(latestTotalDifficulty).toString(10),
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
      } else if (estimatedNumberOfDaysUntilMerge === MILESTONES.HIGH && !isEmitted.high) {
        findings.push(createFinding(mergeInfo));
        isEmitted.high = true;
      } else if (estimatedNumberOfDaysUntilMerge === MILESTONES.MEDIUM && !isEmitted.medium) {
        findings.push(createFinding(mergeInfo));
        isEmitted.medium = true;
      } else if (estimatedNumberOfDaysUntilMerge === MILESTONES.LOW && !isEmitted.low) {
        findings.push(createFinding(mergeInfo));
        isEmitted.low = true;
      } else if (estimatedNumberOfDaysUntilMerge === MILESTONES.PAST && !isEmitted.past) {
        findings.push(createFinding(mergeInfo));
        isEmitted.past = true;
      }

      blockCounter++;
    } else if (!isMerged) {
      findings.push(createFinalFinding(latestTotalDifficulty.toString(10)));
      isMerged = true;
    }
    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(TERMINAL_TOTAL_DIFFICULTY, ETH_BLOCK_DATA, blockCounter),
};
