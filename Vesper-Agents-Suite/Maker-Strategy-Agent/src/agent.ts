import Web3 from "web3";
import { getJsonRpcUrl, TransactionEvent } from "forta-agent";
import { BlockEvent, Finding, HandleBlock } from "forta-agent";
import {
  getMakerStrategies,
  checkIsUnderWaterTrue,
  createFindingHighWater,
  createFindingIsUnderWater,
  createFindingLowWater,
  createFindingStabilityFee,
  getCollateralRatio,
  getLowWater,
  getHighWater,
  getCollateralType,
  JUG_DRIP_FUNCTION_SIGNATURE,
  JUG_CONTRACT
} from "./utils";
import { provideFunctionCallsDetectorHandler } from "forta-agent-tools";

const web3: Web3 = new Web3(getJsonRpcUrl());

export const provideMakerStrategyHandler = (web3: Web3): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const makerStrategies = await getMakerStrategies(
      web3,
      blockEvent.blockNumber
    );

    for (let strategy of makerStrategies) {
      const collateralRatio: Promise<{ collateralRatio: string }> =
        getCollateralRatio(web3, strategy, blockEvent.blockNumber);
      const lowWater: Promise<number> = getLowWater(
        web3,
        strategy,
        blockEvent.blockNumber
      );
      const highWater: Promise<number> = getHighWater(
        web3,
        strategy,
        blockEvent.blockNumber
      );
      const isUnderWater: Promise<boolean> = checkIsUnderWaterTrue(
        web3,
        strategy,
        blockEvent.blockNumber
      );

      await Promise.all([
        collateralRatio,
        lowWater,
        highWater,
        isUnderWater
      ]).then((values) => {
        const collateralRatio = values[0].collateralRatio;
        const lowWater = values[1];
        const highWater = values[2];
        const isUnderWater = values[3];
        if (isUnderWater) {
          findings.push(createFindingIsUnderWater(strategy.toString()));
        }
        if (BigInt(collateralRatio) < BigInt(lowWater)) {
          findings.push(
            createFindingLowWater(
              strategy.toString(),
              collateralRatio,
              lowWater.toString()
            )
          );
        } else if (BigInt(collateralRatio) > BigInt(highWater))
          findings.push(
            createFindingHighWater(
              strategy.toString(),
              collateralRatio,
              highWater.toString()
            )
          );
      });
    }

    return findings;
  };
};

export const provideHandleTransaction = (web3: Web3) => {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (txEvent.status) {
      const makerStrategies = await getMakerStrategies(
        web3,
        txEvent.blockNumber
      );

      for (const strategy of makerStrategies) {
        const collateralType = await getCollateralType(
          web3,
          strategy,
          txEvent.blockNumber
        );

        const filterOnArguments = (args: { [key: string]: any }): boolean => {
          return args[0] === collateralType;
        };

        const agentHandler = provideFunctionCallsDetectorHandler(
          createFindingStabilityFee(strategy.toString()),
          JUG_DRIP_FUNCTION_SIGNATURE,
          { to: JUG_CONTRACT, filterOnArguments }
        );

        findings.push(...(await agentHandler(txEvent)));
      }

      return findings;
    }
    return findings;
  };
};

export default {
  handleBlock: provideMakerStrategyHandler(web3),
  handleTransaction: provideHandleTransaction(web3),
  provideMakerStrategyHandler,
  provideHandleTransaction
};
