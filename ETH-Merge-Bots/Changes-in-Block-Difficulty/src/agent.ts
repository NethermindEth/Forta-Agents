import { Finding, HandleBlock, BlockEvent, getEthersProvider, ethers } from "forta-agent";
import { NUMBER_OF_BLOCKS_TO_CHECK, FINDING_THRESHOLD, createFinding, createFinalFinding } from "./utils";
import BigNumber from "bignumber.js";

BigNumber.set({ DECIMAL_PLACES: 2 });

export const provideHandleBlock = (
  init: boolean,
  finalAlertFlag: boolean,
  provider: ethers.providers.Provider,
  numberOfBlocksToCheck: number,
  threshold: BigNumber
): HandleBlock => {
  let blockDifficulties: BigNumber[] = new Array<BigNumber>();
  let previousBlockTD: BigNumber = new BigNumber(-1);
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    // Raise an alert when the total difficulty stays constant
    if (!finalAlertFlag && previousBlockTD.eq(new BigNumber(blockEvent.block.totalDifficulty))) {
      finalAlertFlag = true;
      findings.push(createFinalFinding(previousBlockTD.toString(), blockEvent.block.totalDifficulty.toString()));
      return findings;
    }

    previousBlockTD = new BigNumber(blockEvent.block.totalDifficulty);

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
    const blockDifficultiesSum: BigNumber = blockDifficulties.reduce((acc: BigNumber, curr: BigNumber) =>
      acc.plus(curr)
    );
    const blockDifficultyMovingAverage: BigNumber = blockDifficultiesSum.dividedBy(blockDifficulties.length);

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
          threshold.toString(10),
          numberOfBlocksToCheck.toString()
        )
      );
    }

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(false, false, getEthersProvider(), NUMBER_OF_BLOCKS_TO_CHECK, FINDING_THRESHOLD),
};
