import { Finding, TransactionEvent } from "forta-agent";
import abi from "./abi";
import DataFetcher from "./data.fetcher";
import { MemoryManager } from "./memory";
import utils from './utils';
import { 
  LogDescription, 
  TransactionDescription,
} from '@ethersproject/abi';

const getMainHandler = (
  idsList: number[], 
  fetcher: DataFetcher,
  mem: MemoryManager,
  shortPeriod: number,
  mediumPeriod: number,
  hugePeriod: number,
) => {
  const ids: Set<string> = new Set<string>(
    idsList.map(id => id.toString()),
  );

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const block: number = txEvent.blockNumber;
    const timestamp: number = txEvent.timestamp;

    // check huge periods without performing a strategy
    const upkeeps: string[] = await Promise.all(
      idsList.map(id => fetcher.getUpkeep(block, id))
    );
    const strategies: string[][] = await Promise.all(
      upkeeps.map(upkeep => fetcher.getStrategies(block, upkeep))
    );
    for(let i = 0; i < ids.size; ++i) {
      for(let strat of strategies[i]) {
        const last: number = mem.getLast(upkeeps[i], strat);
        if((last === -1) || (timestamp - last >= hugePeriod)) {
          findings.push(utils.notCalledFinding(
            idsList[i],
            upkeeps[i],
            strat,
            timestamp - Math.max(last, 0),
            hugePeriod,
          ));
        }
      }
    }

    // Analize addition/removals in the keepers
    upkeeps.forEach((keeper: string) => {
      txEvent
        .filterFunction(abi.STRATEGIES_MANAGMENT, keeper)
        .forEach((desc: TransactionDescription) =>
          // @ts-ignore
          mem[desc.name](
            keeper, 
            desc.args[0].toLowerCase(), 
            timestamp)
          )
    });  

    // Detect performUpkeep calls
    const logs: LogDescription[] = txEvent.filterLog(abi.REGISTRY, fetcher.registry);
    for(let log of logs) {
      if(ids.has(log.args.id.toString())){
        const keeper: string = await fetcher.getUpkeep(block, log.args.id);
        const strat: string = utils.decodePerformData(log.args.performData);
        const diff: number = mem.update(keeper, strat, timestamp);

        if(diff <= shortPeriod)
          findings.push(utils.highCallsFinding(
            log.args.id,
            keeper,
            strat,
            0,
            mem.getCount(keeper, strat),
            shortPeriod,
          ))
        if(diff <= mediumPeriod)
          findings.push(utils.mediumCallsFinding(
            log.args.id,
            keeper,
            strat,
            0,
            mem.getCount(keeper, strat),
            mediumPeriod,
          ))
      }
    }

    return findings;
  };
};

export default getMainHandler;