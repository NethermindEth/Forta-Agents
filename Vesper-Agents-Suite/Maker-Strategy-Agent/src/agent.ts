import Web3 from "web3";
import { getJsonRpcUrl } from "forta-agent";
import { BlockEvent, Finding, HandleBlock } from "forta-agent";
import {
  getMakerStrategies,
  checkIsUnderWaterTrue,
  createFinding,
  getCollateralRatio,
  getLowWater,
  getHighWater,
  TYPE
} from "./utils";

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

export default {
  handleBlock: provideMakerStrategyHandler(web3, "Vesper-1"),
  provideMakerStrategyHandler
};
