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
import { provideFunctionCallsDetectorHandler, FindingGenerator, decodeFunctionCallParameters } from 'forta-agent-tools';


const createFinding: FindingGenerator = (callInfo) => {
  const { 0: strategyAddress, 1: lossValue } = decodeFunctionCallParameters(["address", "uint256"], callInfo.input);

  return Finding.fromObject({
    name: "",
    description: "",
    alertId: "",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      strategyAddress: strategyAddress,
      lossValue: lossValue,
    }
  });
}



const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  
  const poolAccountant: string[] = await getPoolAccountants();
  const reportLossHandlers: HandleTransaction[] = getPoolAccountants.map((poolAccountant) => provideFunctionCallsDetectorHandler());

  let findings: Finding[] = []

  for (let reportLossHandler of reportLossHandlers) {
    findings = findings.concat(await reportLossHandler(txEvent));
  }

  return findings
}


export default {
  handleTransaction,
}
