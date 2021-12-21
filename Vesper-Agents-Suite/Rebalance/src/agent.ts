import { 
  BlockEvent, 
  Finding, 
  FindingSeverity, 
  FindingType, 
  getJsonRpcUrl, 
  HandleBlock, 
  HandleTransaction, 
  TransactionEvent, 
} from 'forta-agent';
import {
  provideFunctionCallsDetectorHandler,
} from 'forta-agent-tools';
import VesperFetcher from './vesper.fetcher';
import Web3 from "web3";
import TimeTracker from './time.tracker';

const CONTROLLER: string = "0xa4f1671d3aee73c05b552d57f2d16d3cfcbd0217";
const _web3Call: any = new Web3(getJsonRpcUrl()).eth.call;

const fetcher: VesperFetcher = new VesperFetcher(_web3Call, CONTROLLER);

const tracker: TimeTracker = new TimeTracker();
const TWO_WEEKS: number = 1209600000; // two weeks in miliseconds
const REBALANCE_SIGNATURE: string = 'rebalance()';

export const createFinding = (address: string, elapsed: number, threshold: number) => 
  Finding.fromObject({
    name: "Vesper Strategies rebalance alert",
    description: "Rebalance function not called since long",
    alertId: "VESPER-4",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Vesper",
    metadata: {
      strategy: address,
      elapsedTime: elapsed.toString(),
      threshold: threshold.toString(),
    }
  })

// Transactions are handled just to detect Rebalance calls and update the times 
export const provideHandleTransaction = (
  fetcher: VesperFetcher, 
  tracker: TimeTracker
): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    if(txEvent.status){
      const strategies: string[] = await fetcher.getAllStrategies(txEvent.blockNumber);
      const handlers: HandleTransaction[] = strategies.map(
        (strat: string) => provideFunctionCallsDetectorHandler(
          (_) => { return {} as Finding; }, 
          REBALANCE_SIGNATURE,
          {to: strat},  
        ),
      );
      for(let i = 0; i < strategies.length; ++i){
        const findings: Finding[] = await handlers[i](txEvent);
        if(findings.length > 0)
          tracker.update(strategies[i], txEvent.timestamp);
      }
    }
    
    return [];
  };
};

export const provideHandleBlock = (
  fetcher: VesperFetcher, 
  timeThreshold: number,
  tracker: TimeTracker,
): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const strategies: string[] = await fetcher.getAllStrategies(blockEvent.blockNumber);
    strategies.forEach(
      (strat: string) => {
        const [success, time] = tracker.tryGetLastTime(strat);
        if(!success) {
          // set this block as the time to start tracking the strategy
          tracker.update(strat, blockEvent.block.timestamp);
          return;
        };
        
        const elapsed: number = blockEvent.block.timestamp - time;
        if(elapsed > timeThreshold)
          findings.push(createFinding(strat, elapsed, timeThreshold));
      }
    );

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(fetcher, tracker),
  handleBlock: provideHandleBlock(fetcher, TWO_WEEKS, tracker),
};
