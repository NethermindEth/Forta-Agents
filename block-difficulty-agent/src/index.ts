import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";
import BlockDifficultyGetter from "./blockDifficultyGetter";
import Web3 from "web3";
import { mean, std, abs } from "mathjs";

const NUMBER_OF_BLOCKS_TO_CHECK = 50;

const web3: Web3 = new Web3(getJsonRpcUrl());
const blockDifficultyGetter: BlockDifficultyGetter = new BlockDifficultyGetter(
  web3
);

const getDifficultyChangeForBlock = async (
  blockNumber: number,
  blockDifficultyGetter: BlockDifficultyGetter
): Promise<number> => {
  const prevBlockDifficulty: number = await blockDifficultyGetter.getDifficulty(
    blockNumber - 1
  );
  const blockDifficulty: number = await blockDifficultyGetter.getDifficulty(
    blockNumber
  );
  return blockDifficulty - prevBlockDifficulty;
};

const getDifficultyChangesFromBlockRange = async (
  startBlock: number,
  endBlock: number,
  blockDifficultyGetter: BlockDifficultyGetter
): Promise<number[]> => {
  let currentBlock: number = startBlock;
  const difficultyChanges: number[] = [];
  while (currentBlock <= endBlock) {
    difficultyChanges.push(
      await getDifficultyChangeForBlock(currentBlock, blockDifficultyGetter)
    );
    currentBlock++;
  }
  return difficultyChanges;
};

const isRelevant = (
  difficultyChange: number,
  difficultyChangeHistory: number[]
): Boolean => {
  const meanChange: number = mean(difficultyChangeHistory);
  const stDeviationChange: number = std(difficultyChangeHistory);
  const deviation: number = abs(meanChange - difficultyChange);
  return deviation > stDeviationChange;
};

const getSeverity = (difficultyChange: number): FindingSeverity => {
  if (difficultyChange >= 0) {
    return FindingSeverity.Info;
  }
  return FindingSeverity.High;
}

const provideHandleBlock = (
  web3: Web3,
  blockDifficultyGetter: BlockDifficultyGetter,
  numberOfBlocksToCheck: number
): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const currentBlock = blockEvent.blockNumber;
    const startBlock = currentBlock - numberOfBlocksToCheck;
    const difficultyChangesHistory = await getDifficultyChangesFromBlockRange(
      startBlock,
      currentBlock - 1,
      blockDifficultyGetter
    );

    const actualBlockChange = await getDifficultyChangeForBlock(
      currentBlock,
      blockDifficultyGetter
    );

    if (isRelevant(actualBlockChange, difficultyChangesHistory)) {
      findings.push(Finding.fromObject({
        name: "Unusual Difficulty Change",
        description: `Block number ${currentBlock} made an unusual difficulty change`,
        alertId: "NETHFORTA-8",
        severity: getSeverity(actualBlockChange),
        type: FindingType.Suspicious
      }));
    }
    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(web3, blockDifficultyGetter, NUMBER_OF_BLOCKS_TO_CHECK),
};
