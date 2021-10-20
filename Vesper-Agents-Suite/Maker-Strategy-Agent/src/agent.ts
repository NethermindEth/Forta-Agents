import Web3 from 'web3';
import { getJsonRpcUrl } from 'forta-agent';
import { BlockEvent, Finding, HandleBlock } from 'forta-agent';
import {
  getMakerStrategies,
  checkIsUnderWaterTrue,
  createFinding,
  getCollateralRatio,
  getLowWater,
  getHighWater,
  TYPE,
} from './utils';

const web3: Web3 = new Web3(getJsonRpcUrl());

export const provideMakerStrategyHandler = (
  web3: any,
  alertId: string
): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const makerStrategies = await getMakerStrategies(
      web3,
      blockEvent.blockNumber
    );

    for (let str of makerStrategies) {
      if (
        (await checkIsUnderWaterTrue(web3, blockEvent.blockNumber, str)) == true
      )
        findings.push(createFinding(alertId, TYPE.isUnderWater));
    }

    for (let str of makerStrategies) {
      const collateralRatio: { collateralRatio: string } =
        await getCollateralRatio(web3, blockEvent.blockNumber, str);

      const lowWater = await getLowWater(web3, blockEvent.blockNumber, str);
      const highWater = await getHighWater(web3, blockEvent.blockNumber, str);

      if (BigInt(collateralRatio.collateralRatio) < BigInt(lowWater)) {
        findings.push(createFinding(alertId, TYPE.lowWater));
      } else if (BigInt(collateralRatio.collateralRatio) > BigInt(highWater))
        findings.push(createFinding(alertId, TYPE.highWater));
    }

    return findings;
  };
};

module.exports = {
  handleBlock: provideMakerStrategyHandler(web3, ''),
};
