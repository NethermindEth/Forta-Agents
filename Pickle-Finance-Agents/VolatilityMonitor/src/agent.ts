import { 
  getEthersProvider, 
  HandleTransaction, 
} from 'forta-agent';
import { MemoryManager } from './memory';
import DataFetcher from './data.fetcher';
import constants from './constants';
import { Block } from '@ethersproject/abstract-provider';
import getMainHandler from './main.handler';
import getFloodModerator from './flood.moderator';

const AMOUNT_OF_CALLS: number = 5;
const MEMORY: MemoryManager = new MemoryManager(AMOUNT_OF_CALLS);
const FETCHER: DataFetcher = new DataFetcher(
  constants.REGISTRY, 
  getEthersProvider(),
)

const initialize = async () => {
  // fetch lastest block
  const block: number = await FETCHER.provider.getBlockNumber();
  const data: Block = await FETCHER.provider.getBlock(block);

  // fetch upkeeps data from latest blocks
  const upkeeps: string[] = await Promise.all(
    constants.IDS.map(id => FETCHER.getUpkeep(block, id))
  );
  const strategies: string[][] = await Promise.all(
    upkeeps.map(upkeep => FETCHER.getStrategies(block, upkeep))
  );
  // Add all the currently added strategies per upkeep
  // to avoid fake huge time without call perform alerts
  for(let i = 0; i < upkeeps.length; ++i) {
    for(let strat of strategies[i]) 
      MEMORY.addStrategy(upkeeps[i], strat, data.timestamp);
  }
};

export const provideHandleTransaction = (
  idsList: number[], 
  fetcher: DataFetcher,
  mem: MemoryManager,
  shortPeriod: number,
  mediumPeriod: number,
  hugePeriod: number,
): HandleTransaction => {
  
  // Main agent logic
  const handler: HandleTransaction = getMainHandler(
    idsList,
    fetcher,
    mem,
    shortPeriod,
    mediumPeriod,
    hugePeriod,
  );

  // Wrap the logic to moderate duplicated findings over time
  const floodModeratorHandler: HandleTransaction = getFloodModerator(
    handler,
    shortPeriod,
    mediumPeriod,
  );

  return floodModeratorHandler;
}

export default {
  initialize,
  handleTransaction: provideHandleTransaction(
    constants.IDS,
    FETCHER,
    MEMORY,
    constants.ONE_DAY,
    constants.ONE_WEEK,
    constants.ONE_MONTH,
  ),
};
