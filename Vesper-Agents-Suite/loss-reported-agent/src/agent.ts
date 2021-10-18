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



export default {
  handleTransaction,
}
