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
  const currentRatioPromise = getCurrentBorrowRatio(
    web3,
    contractAddress,
    blockEvent.blockNumber
  );
  const maxRatioPromise = getMaxBorrowRatio(
    web3,
    contractAddress,
    blockEvent.blockNumber
  );

  if ((await currentRatioPromise) > (await maxRatioPromise)) {
    findings.push(
      createFindingForHighCurrentBorrowRatio(
        contractAddress,
        await currentRatioPromise,
        await maxRatioPromise
      )
    );
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
  const collateralFactorPromise = getCollateralFactorMantissa(
    web3,
    cToken,
    blockEvent.blockNumber
  );
  const scaledBorrowRatioPromise = getScaledCurrentBorrowRatio(
    web3,
    contractAddress,
    blockEvent.blockNumber
  );

  if (
    (await collateralFactorPromise) - (await scaledBorrowRatioPromise) <=
      1e17 ||
    (await scaledBorrowRatioPromise) > (await collateralFactorPromise)
  ) {
    findings.push(
      createFindingForLiquidationWarning(
        contractAddress,
        await scaledBorrowRatioPromise,
        await collateralFactorPromise
      )
    );
  }

  return findings;
};

export const provideHandleBlock = (web3: Web3): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    let findings: Finding[] = [];

    const compoundLeverageStrategies: string[] =
      await getCompoundLeverageStrategies(web3, blockEvent.blockNumber);

    const currentRatioTooHighPromises = compoundLeverageStrategies.map(
      (strategy: string) => currentRatioTooHigh(web3, strategy, blockEvent)
    );
    const closeToLiquidationPromises = compoundLeverageStrategies.map(
      (strategy: string) => closeToLiquidation(web3, strategy, blockEvent)
    );

    findings = findings.concat((await Promise.all(currentRatioTooHighPromises)).flat());
    findings = findings.concat((await Promise.all(closeToLiquidationPromises)).flat());

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(web3),
};
