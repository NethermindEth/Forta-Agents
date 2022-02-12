import * as gnosisHandler from './function.monitoring' 
import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
} from 'forta-agent'


const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  let findings: Finding[] = []
  findings = (
      await Promise.all([
        gnosisHandler.provideHandleTransaction(txEvent),
      ])
    ).flat();

  return findings
}

export default {
  handleTransaction,
}