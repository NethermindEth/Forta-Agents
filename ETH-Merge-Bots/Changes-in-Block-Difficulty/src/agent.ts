import { Finding, HandleBlock, BlockEvent, getEthersProvider, ethers } from "forta-agent";
import { NUMBER_OF_BLOCKS_TO_CHECK, FINDING_THRESHOLD, createFinding, TERMINAL_TOTAL_DIFFICULTY } from "./utils";
import BigNumber from "bignumber.js";

BigNumber.set({ DECIMAL_PLACES: 2 });

export const provideHandleBlock = (
  init: boolean,
  provider: ethers.providers.Provider,
  numberOfBlocksToCheck: number,
  threshold: BigNumber
): HandleBlock => {
  let blockDifficulties: BigNumber[] = new Array<BigNumber>();
  let blockDifficultyMovingAverage: BigNumber;

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    // check if TTD has been reached
    if (new BigNumber(blockEvent.block.totalDifficulty).gte(TERMINAL_TOTAL_DIFFICULTY)) return findings;

    // executed on the first run
    if (!init) {
      init = true;
      //populate the blockDifficulties array in ascending block order
      for (let i = 0; i <= numberOfBlocksToCheck - 1; i++) {
        const blockDifficulty = new BigNumber(
          (await provider.getBlock(blockEvent.blockNumber - numberOfBlocksToCheck + i))._difficulty.toString()
        );
        blockDifficulties.push(blockDifficulty);
      }
    }

    //remove the oldest block difficulty
    blockDifficulties.shift();
    //add new block difficulty
    const currentDifficulty: BigNumber = new BigNumber(blockEvent.block.difficulty);
    blockDifficulties.push(currentDifficulty);
    //calculate the new moving average
    let blockDifficultiesSum: BigNumber = blockDifficulties.reduce((acc: BigNumber, curr: BigNumber) => acc.plus(curr));
    blockDifficultyMovingAverage = blockDifficultiesSum.dividedBy(blockDifficulties.length);
    //clear the sum
    blockDifficultiesSum = new BigNumber(0);

    const changePercentage = currentDifficulty
      .minus(blockDifficultyMovingAverage)
      .shiftedBy(2)
      .dividedBy(blockDifficultyMovingAverage)
      .absoluteValue();

    if (changePercentage.gte(threshold)) {
      findings.push(
        createFinding(
          currentDifficulty.toString(10),
          blockDifficultyMovingAverage.toString(10),
          changePercentage.toString(10),
          threshold.toString(10)
        )
      );
    }

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(false, getEthersProvider(), NUMBER_OF_BLOCKS_TO_CHECK, FINDING_THRESHOLD),
};
