import { BlockEvent, Finding, HandleBlock } from 'forta-agent';
import {
  getMakerStrategies,
  checkIsUnderWaterTrue,
  createFinding,
  getCollateralRatio,
  getLowWater,
  getHighWater,
} from './utils';

export const provideMakerStrategyHandler = (web3: any): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const makerStrategies = await getMakerStrategies(
      web3,
      blockEvent.blockNumber
    );

    for (let str of makerStrategies) {
      console.log(str);

      if (
        (await checkIsUnderWaterTrue(web3, blockEvent.blockNumber, str)) == true
      )
        findings.push(createFinding());
    }

    for (let str of makerStrategies) {
      const collateralRatio: { collateralRatio: string } =
        await getCollateralRatio(web3, blockEvent.blockNumber, str);

      const lowWater = await getLowWater(web3, blockEvent.blockNumber, str);
      const highWater = await getHighWater(web3, blockEvent.blockNumber, str);

      if (BigInt(collateralRatio.collateralRatio) < BigInt(lowWater)) {
        findings.push(createFinding());
      } else if (BigInt(collateralRatio.collateralRatio) > BigInt(highWater))
        findings.push(createFinding());
    }

    return findings;
  };
};

export default provideMakerStrategyHandler;
