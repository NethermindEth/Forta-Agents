import Web3 from "web3";
import { getJsonRpcUrl, Trace, TransactionEvent } from "forta-agent";
import { BlockEvent, Finding, HandleBlock } from "forta-agent";
import {
  getMakerStrategies,
  checkIsUnderWaterTrue,
  createFinding,
  getCollateralRatio,
  getLowWater,
  getHighWater,
  TYPE,
  getCollateralType,
  JUG_DRIP_FUNCTION_SIGNATURE,
  createStabilityFeeFinding
} from "./utils";
import {
  encodeFunctionSignature,
  provideFunctionCallsDetectorHandler
} from "forta-agent-tools";

const web3: Web3 = new Web3(getJsonRpcUrl());

export const provideMakerStrategyHandler = (
  web3: Web3,
  alertId: string
): HandleBlock => {
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
        findings.push(
          createFinding(alertId, TYPE.isUnderWater, strategy.toString())
        );
      }
      if (BigInt(collateralRatio.collateralRatio) < BigInt(lowWater)) {
        findings.push(
          createFinding(
            alertId,
            TYPE.lowWater,
            strategy.toString(),
            collateralRatio.collateralRatio,
            lowWater.toString()
          )
        );
      } else if (BigInt(collateralRatio.collateralRatio) > BigInt(highWater))
        findings.push(
          createFinding(
            alertId,
            TYPE.highWater,
            strategy.toString(),
            collateralRatio.collateralRatio,
            highWater.toString()
          )
        );
    }

    return findings;
  };
};

export const provideHandleTransaction = (web3: Web3, alertId: string) => {
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

        const traces = txEvent.traces.filter((trace: Trace) => {
          const expectedSelector: string = encodeFunctionSignature(
            JUG_DRIP_FUNCTION_SIGNATURE
          );
          const functionSelector = trace.action.input.slice(0, 10);

          if (functionSelector == expectedSelector) {
            const input = "0x" + trace.action.input.slice(10);
            if (input == collateralType) return true;
          }
        });

        if (!traces.length) return findings;

        findings.push(createStabilityFeeFinding(alertId, strategy.toString()));
      }

      return findings;
    }
    return findings;
  };
};

export default {
  handleBlock: provideMakerStrategyHandler(web3, "Vesper-1-0"),
  handleTransaction: provideHandleTransaction(web3, "Vesper-1-1"),
  provideMakerStrategyHandler,
  provideHandleTransaction
};
