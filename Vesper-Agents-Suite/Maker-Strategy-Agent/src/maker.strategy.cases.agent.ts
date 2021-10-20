import { BlockEvent, Finding, HandleBlock } from 'forta-agent';
import { getMakerStrategies, checkIsUnderWater, createFinding } from './utils';

export const provideMakerStrategyHandler = (web3: any): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const makerStrategies = await getMakerStrategies(
      web3,
      blockEvent.blockNumber
    );

    for (let str of makerStrategies) {
      if ((await checkIsUnderWater(web3, blockEvent.blockNumber, str)) == true)
        findings.push(createFinding());
    }

    return findings;
  };
};

export default provideMakerStrategyHandler;
