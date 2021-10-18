import BigNumber from 'bignumber.js'
import { 
  BlockEvent, 
  Finding, 
  HandleBlock, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent'
import { provideFunctionCallsDetectorHandler, FindingGenerator } from 'forta-agent-tools';

  


const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  
  const v3Strategies: string[] = await getV3Strategies();
  const reportLossHandlers: HandleTransaction[] = v3Strategies.map((strategy) => provideFunctionCallsDetectorHandler());
  const reportEarningsHandlers: HandleTransaction[] = v3Strategies.map((strategy) => provideFunctionCallsDetectorHandler());

  let findings: Finding[] = []

  for (let reportLossHandler of reportLossHandlers) {
    findings = findings.concat(await reportLossHandler(txEvent));
  }

  for (let reportEarningsHandler of reportEarningsHandlers ) {
    findings = findings.concat(await reportEarningsHandler(txEvent));
  }
  
  return findings
}


export default {
  handleTransaction,
}
