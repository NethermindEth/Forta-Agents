import BigNumber from "bignumber.js";
import { BlockEvent, Finding, HandleBlock, getJsonRpcUrl } from "forta-agent";
import {
  getCurrentBorrowRatio,
  getMaxBorrowRatio,
  getRelatedCToken,
  getCollateralFactorMantissa,
  getScaledCurrentBorrowRatio,
  getCompoundLeverageStrategies,
  createFindingForLiquidationWarning,
  createFindingForHighCurrentBorrowRatio,
} from "./utils";
import Web3 from "web3";

const web3 = new Web3(getJsonRpcUrl());

const currentRatioTooHigh = async (
  web3: Web3,
  contractAddress: string,
  blockEvent: BlockEvent
): Promise<Finding[]> => {
  const findings: Finding[] = [];
  const currentRatio = await getCurrentBorrowRatio(
    web3,
    contractAddress,
    blockEvent.blockNumber
  );
  const maxRatio = await getMaxBorrowRatio(
    web3,
    contractAddress,
    blockEvent.blockNumber
  );

  if (currentRatio > maxRatio) {
    findings.push(createFindingForHighCurrentBorrowRatio(contractAddress));
  }

  return findings;
};

const closeToLiquidation = async (
  web3: Web3,
  contractAddress: string,
  blockEvent: BlockEvent
): Promise<Finding[]> => {
  const findings: Finding[] = [];
  const cToken = await getRelatedCToken(
    web3,
    contractAddress,
    blockEvent.blockNumber
  );
  const collateralFactor = await getCollateralFactorMantissa(
    web3,
    cToken,
    blockEvent.blockNumber
  );
  const scaledBorrowRation = await getScaledCurrentBorrowRatio(
    web3,
    contractAddress,
    blockEvent.blockNumber
  );

  if (
    collateralFactor - scaledBorrowRation > 10e18 ||
    scaledBorrowRation > collateralFactor
  ) {
    findings.push(createFindingForLiquidationWarning(contractAddress));
  }

  return findings;
};

const provideHandleBlock = (web3: Web3): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    let findings: Finding[] = [];

    const compoundLeverageStrategies: string[] =
      await getCompoundLeverageStrategies(web3, blockEvent.blockNumber);

    for (let strategy of compoundLeverageStrategies) {
      findings = findings.concat(
        await currentRatioTooHigh(web3, strategy, blockEvent)
      );
    }

    for (let strategy of compoundLeverageStrategies) {
      findings = findings.concat(
        await closeToLiquidation(web3, strategy, blockEvent)
      );
    }

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(web3),
};
