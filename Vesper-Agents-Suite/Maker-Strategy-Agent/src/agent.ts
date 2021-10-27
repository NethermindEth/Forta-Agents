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
      const collateralRatio: { collateralRatio: string } =
        await getCollateralRatio(web3, strategy, blockEvent.blockNumber);
      const lowWater = await getLowWater(
        web3,
        strategy,
        blockEvent.blockNumber
      );
      const highWater = await getHighWater(
        web3,
        strategy,
        blockEvent.blockNumber
      );

      if (await checkIsUnderWaterTrue(web3, strategy, blockEvent.blockNumber)) {
        findings.push(createFindingIsUnderWater(strategy.toString()));
      }
      if (BigInt(collateralRatio.collateralRatio) < BigInt(lowWater)) {
        findings.push(
          createFindingLowWater(
            strategy.toString(),
            collateralRatio.collateralRatio,
            lowWater.toString()
          )
        );
      } else if (BigInt(collateralRatio.collateralRatio) > BigInt(highWater))
        findings.push(
          createFindingHighWater(
            strategy.toString(),
            collateralRatio.collateralRatio,
            highWater.toString()
          )
        );
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
