import BigNumber from "bignumber.js";

export const getNumberOfDays = (avgBlockTime: number, estimatedNumberOfBlocksUntilMerge: BigNumber) => {
  // One day in milliseconds
  const oneDay = 1000 * 60 * 60 * 24;

  const date = new Date();
  date.setSeconds(estimatedNumberOfBlocksUntilMerge.multipliedBy(avgBlockTime).plus(date.getSeconds()).toNumber());

  const estimatedMergeDate = new Date(date);

  const now = new Date(Date.now());

  const diffInTime = estimatedMergeDate.getTime() - now.getTime();
  const diffInDays = Math.ceil(diffInTime / oneDay);

  return { diffInDays, estimatedMergeDate };
};

export const getAverageBlockTime = (
  ethBlockData: any,
  currentBlockTimestamp: number,
  firstTimestamp: number,
  blockCounter: number
) => {
  const avgTimeSpentInAWeek = ethBlockData.avgBlockTime * ethBlockData.blockNumberAWeek;

  const avgBlockTime =
    (avgTimeSpentInAWeek + currentBlockTimestamp - firstTimestamp) / (ethBlockData.blockNumberAWeek + blockCounter);

  return avgBlockTime;
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
