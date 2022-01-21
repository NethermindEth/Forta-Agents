import { 
  Finding, 
  getEthersProvider, 
  HandleTransaction, 
  TransactionEvent, 
} from 'forta-agent';
import abi from './abi';
import Memory from './memory';
import { 
  LogDescription, 
  TransactionDescription,
} from '@ethersproject/abi';
import DataFetcher from './data.fetcher';
import utils, { 
  FindingGenerator, 
  Validator 
} from './utils';
import constants from './constants';

const provideHandleTransaction = (
  idsList: number[], 
  fetcher: DataFetcher,
  shortPeriod: number,
  mediumPeriod: number,
  hugePeriod: number,
  amountOfCalls: number,
): HandleTransaction => {
  const shortMem = new Memory(shortPeriod);
  const mediumMem = new Memory(mediumPeriod);
  const hugeMem = new Memory(hugePeriod);
  const allMem: Memory[] = [shortMem, mediumMem, hugeMem];

  const ids: Set<number> = new Set<number>(idsList);

  const checkMem = async (
    mem: Memory, 
    block: number, 
    timestamp: number,
    validator: Validator,
    findingGenerator: FindingGenerator,
  ): Promise<Finding[]> => {
    if(!mem.isTimePassed(timestamp))
      return [];

    const findings: Finding[] = [];

    const upkeeps: string[] = await Promise.all(
      idsList.map(id => fetcher.getUpkeep(block, id))
    );
    const strategies: string[][] = await Promise.all(
      upkeeps.map(upkeep => fetcher.getStrategies(block, upkeep))
    );

    for(let i = 0; i < ids.size; ++i) {
      for(let strat of strategies[i]) {
        const count: number = mem.getCount(upkeeps[i], strat);
        const time: number = mem.getLastTime(upkeeps[i], strat);
        if(validator(count)) {
          findings.push(findingGenerator(
            idsList[i],
            upkeeps[i],
            strat,
            time,
            count,
            mem.period,
          ));
        }
      }
    }

    mem.clear();
    return findings;    
  };

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const block: number = txEvent.blockNumber;
    const timestamp: number = txEvent.timestamp;

    // Analize addition/removals in the keepers
    const upkeeps: string[] = await Promise.all(
      idsList.map(id => fetcher.getUpkeep(block, id))
    );
    upkeeps.forEach((keeper: string) => {
      txEvent
        .filterFunction(abi.STRATEGIES_MANAGMENT, keeper)
        .forEach((desc: TransactionDescription) =>
          // @ts-ignore
          allMem.forEach(mem => mem[desc.name](keeper, desc.args[0], timestamp))
        )
    });  

    // Detect performUpkeep calls
    const logs: LogDescription[] = txEvent.filterLog(abi.REGISTRY, fetcher.registry);
    for(let log of logs) {
      if(ids.has(log.args.id)){
        const keeper: string = await fetcher.getUpkeep(block, log.args.id);
        const strat: string = utils.decodePerformData(log.args.performData);
        allMem.forEach(mem => mem.update(keeper, strat, timestamp))
      }
    }

    // Check short time intervals with multiple calls
    findings.push(... await checkMem(
      shortMem, 
      block, 
      timestamp, 
      utils.countGteThreshold(amountOfCalls),
      utils.highCallsFinding,
    ));

    // Check medium time intervals with multiple calls
    findings.push(... await checkMem(
      mediumMem, 
      block, 
      timestamp, 
      utils.countGteThreshold(amountOfCalls),
      utils.mediumCallsFinding,
    ));

    // Check huge time without performing an strategy
    findings.push(... await checkMem(
      hugeMem, 
      block, 
      timestamp, 
      utils.notAddedRecently,
      utils.mediumCallsFinding,
    ));

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(
    constants.IDS,
    new DataFetcher(
      constants.REGISTRY, 
      getEthersProvider(),
    ),
    constants.ONE_DAY,
    constants.ONE_WEEK,
    constants.ONE_MONTH,
    constants.AMOUNT_OF_CALLS,
  ),
};
