import BigNumber from "bignumber.js";
import type ethers from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export interface TokenInfo {
  chainlinkFeedAddress: string;
  absoluteThreshold?: string;
  percentageThreshold?: string;
  intervalSeconds: string;
}

export type MonitoringInfo = {
  description: string;
  decimals: number;
  lastTimestamp: ethers.BigNumber;
  lastAnswer: BigNumber;
  absoluteThreshold?: BigNumber;
  ratioThreshold?: BigNumber;
  intervalSeconds: ethers.BigNumber;
  contract: ethers.Contract;
};

export interface AgentConfig {
  tokens: TokenInfo[];
}

export function ethersBnToBn(value: ethers.BigNumber, decimals: number): BigNumber {
  return new BigNumber(value.toString()).shiftedBy(-decimals);
}

export function createPriceChangeFinding(
  feedDescription: string,
  latestAnswer: BigNumber,
  absoluteDiff: BigNumber,
  percentageDiff: BigNumber
): Finding {
  return Finding.from({
    alertId: "UMEE-5-1",
    name: "Large price change in treasury token",
    description: `A large price change was detected in the ${feedDescription} feed`,
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Umee",
    metadata: {
      feed: feedDescription,
      answer: latestAnswer.toString(10),
      diff: absoluteDiff.toString(10),
      percentageDiff: percentageDiff.toString(10),
    },
  });
}

export function createNegativeAnswerFinding(feedDescription: string): Finding {
  return Finding.from({
    alertId: "UMEE-5-2",
    name: "Negative answer in treasury token feed answer",
    description: `A negative answer was detected in the ${feedDescription} feed`,
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    protocol: "Umee",
    metadata: {
      feed: feedDescription,
    },
  });
}
