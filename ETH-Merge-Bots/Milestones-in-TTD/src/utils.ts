import BigNumber from "bignumber.js";

export const getNumberOfDays = (avgBlockTime: number, estimatedNumberOfBlocksUntilMerge: BigNumber) => {
  // One day in milliseconds
  const oneDay = 1000 * 60 * 60 * 24;

  const estimatedMergeDate = new Date();
  estimatedMergeDate.setSeconds(
    estimatedNumberOfBlocksUntilMerge.multipliedBy(avgBlockTime).plus(estimatedMergeDate.getSeconds()).toNumber()
  );

  const now = new Date();

  const diffInTime = estimatedMergeDate.getTime() - now.getTime();
  const diffInDays = Math.ceil(diffInTime / oneDay);

  return { diffInDays, estimatedMergeDate };
};

export const getUpdatedBlockTime = (
  ethBlockData: any,
  currentBlockTimestamp: number,
  firstTimestamp: number,
  blockCounter: number
) => {
  const avgTimeSpentInAWeek = ethBlockData.avgBlockTimeFromRecentPast * ethBlockData.blockNumberAWeek;

  const updatedBlockTime =
    (avgTimeSpentInAWeek + currentBlockTimestamp - firstTimestamp) / (ethBlockData.blockNumberAWeek + blockCounter);

  return updatedBlockTime;
};

export const getEstimatedNumberOfBlocksUntilMerge = (
  ttd: BigNumber,
  totalDifficulty: BigNumber,
  avgBlockDifficulty: BigNumber
) => {
  const estimatedNumberOfBlocksUntilMerge = ttd.minus(totalDifficulty).dividedBy(avgBlockDifficulty).decimalPlaces(0);

  return estimatedNumberOfBlocksUntilMerge;
};

export const getAvgBlockDifficulty = (blockDifficulties: BigNumber[]): BigNumber => {
  // Keep the last 100 blocks' difficulties
  if (blockDifficulties.length === 101) {
    blockDifficulties.shift();
  }

  const sumOfBlockDifficulties = blockDifficulties.reduce(
    (accumulator: BigNumber, curr: BigNumber) => curr.plus(accumulator),
    new BigNumber("0")
  );

  const avgBlockDifficulty = sumOfBlockDifficulties.dividedBy(blockDifficulties.length);

  return avgBlockDifficulty;
};
