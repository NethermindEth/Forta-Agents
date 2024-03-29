import { Finding, FindingSeverity, FindingType } from "forta-agent";

export type MergeInfo = {
  estimatedNumberOfDaysUntilMerge: number;
  estimatedMergeDate: Date;
  latestTotalDifficulty: string;
  remainingDifficulty: string;
};

export const createFinding = (mergeInfo: MergeInfo): Finding => {
  const { estimatedNumberOfDaysUntilMerge, estimatedMergeDate, latestTotalDifficulty, remainingDifficulty } = mergeInfo;

  return Finding.from({
    name: "Milestone in Terminal Total Difficulty",
    description: `Based on current difficulty averages, approximately ${estimatedNumberOfDaysUntilMerge} days until the merge.`,
    alertId: "ETH-1-1",
    protocol: "Ethereum",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      estimatedMergeDate: estimatedMergeDate.toUTCString(),
      latestTotalDifficulty,
      remainingDifficulty,
    },
  });
};

export const createFinalFinding = (totalDifficulty: string): Finding => {
  return Finding.from({
    name: "Terminal Total Difficulty reached",
    description: "Terminal Total Difficulty has been reached, ETH has merged!",
    alertId: "ETH-1-2",
    protocol: "Ethereum",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      totalDifficulty,
    },
  });
};
