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

const CONTROLLER: string = "0xa4f1671d3aee73c05b552d57f2d16d3cfcbd0217";
const _web3Call: any = new Web3(getJsonRpcUrl());

const fetcher: VesperFetcher = new VesperFetcher(_web3Call, CONTROLLER);

const TWO_WEEKS: number = 1209600000; // two weeks in miliseconds
const REBALANCE_SIGNATURE: string = 'rebalance()';

const createFinding = (address: string, elapsed: number) => 
  Finding.fromObject({
    name: "Vesper Strategies rebalance alert",
    description: "Rebalance function not called since long",
    alertId: "VESPER-4",
    severity: FindingSeverity.High,
    type: FindingType.Info,
    metadata: {
      strategy: address,
      elapsedTime: elapsed.toString(),
    }
  })

const provideHandleTransaction = (fetcher: VesperFetcher): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    if(txEvent.status){
      const strategies: string[] = await fetcher.getAllStrategies();
      const handlers: HandleTransaction[] = strategies.map(
        (strat: string) => provideFunctionCallsDetectorHandler(
          (_) => { return {} as Finding }, 
          REBALANCE_SIGNATURE,
          {to: strat},  
        ),
      );
      for(let handler of handlers){
        const findings: Finding[] = await handler(txEvent);
        if(findings.length > 0){
          //TODO: Update calls time
        }
      }
    }
    
    return [];
  };
};

const provideHandleBlock = (fetcher: VesperFetcher): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const strategies: string[] = await fetcher.getAllStrategies();
    strategies.forEach(
      (strat: string) => {
        //TODO: Calculate de elapsed time without calling rebalance for the current strat
        const elapsed: number = 0;
        if(elapsed > TWO_WEEKS)
          findings.push(createFinding(strat, elapsed));
      }
    );

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(fetcher),
  handleBlock: provideHandleBlock(fetcher),
};
