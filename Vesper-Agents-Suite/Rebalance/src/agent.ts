import { 
  BlockEvent, 
  Finding, 
  FindingSeverity, 
  FindingType, 
  HandleBlock, 
  HandleTransaction, 
  TransactionEvent, 
} from 'forta-agent';
import {
  provideFunctionCallsDetectorHandler,
} from 'forta-agent-tools';

const TWO_WEEKS: number = 1209600000; // two weeks in miliseconds
const REBALANCE_SIGNATURE: string = 'rebalance()';
const STRATEGIES: string[] = [
  "0x6897d2cbf66e317bde74595C455bee09cf144136",
  "0x0538C8bac84e95a9df8ac10aad17dbe81b9e36ee",
];

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

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  if(txEvent.status){
    //TODO: Fetch the correct strategies
    const handlers: HandleTransaction[] = STRATEGIES.map(
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

const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
  const findings: Finding[] = [];
  
  STRATEGIES.forEach(
    (strat: string) => {
      //TODO: Calculate de elapsed time without calling rebalance for the current strat
      const elapsed: number = 0;
      if(elapsed > TWO_WEEKS)
        findings.push(createFinding(strat, elapsed));
    }
  );

  return findings;
};

export default {
  handleTransaction,
  handleBlock,
};
