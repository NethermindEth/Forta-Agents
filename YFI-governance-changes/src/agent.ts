import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent';
import {
  provideFunctionCallsDetectorAgent,
} from 'general-agents-module';

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  return findings;
}

export default {
  handleTransaction,
};
