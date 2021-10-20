import {
  BlockEvent,
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType,
} from 'forta-agent';
import {
  IsUnderWaterCall,
  Pools,
  Strategy,
  getPools,
  getStrategies,
  getMakerStrategies,
  checkIsUnderWater,
  createFinding,
} from './utils';

export const provideMakerStrategyHandler = (
  web3: any,
  address: string = '0x235A6DCe7D40fa5b0157F55Dda0693dcAc4Ea932'
): HandleBlock => {
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
