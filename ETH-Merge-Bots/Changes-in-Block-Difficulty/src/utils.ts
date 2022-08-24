import { Finding, FindingSeverity, FindingType } from "forta-agent";
import BigNumber from "bignumber.js";

export const NUMBER_OF_BLOCKS_TO_CHECK: number = 100;
export const FINDING_THRESHOLD: BigNumber = new BigNumber(1.5);

export const TERMINAL_TOTAL_DIFFICULTY: BigNumber = new BigNumber("58750000000000000000000");

export const createFinding = (
  blockDifficulty: string,
  movingAverage: string,
  changePercentage: string,
  threshold: string,
  numberOfBlocks: string
): Finding => {
  if (blockDifficulty > movingAverage) {
    return Finding.fromObject({
      name: "Unusual Block Difficulty Increase Detection",
      description: `Block difficulty increased more than ${threshold}% compared to the moving average of the last ${numberOfBlocks} blocks`,
      alertId: "ETH-2-1",
      protocol: "Ethereum",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        blockDifficulty,
        movingAverage,
        increasePercentage: `${changePercentage}%`,
      },
    });
  } else
    return Finding.fromObject({
      name: "Unusual Block Difficulty Decrease Detection",
      description: `Block difficulty decreased more than ${threshold}% compared to the moving average of the last ${numberOfBlocks} blocks`,
      alertId: "ETH-2-2",
      protocol: "Ethereum",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        blockDifficulty,
        movingAverage,
        decreasePercentage: `-${changePercentage}%`,
      },
    });
};
