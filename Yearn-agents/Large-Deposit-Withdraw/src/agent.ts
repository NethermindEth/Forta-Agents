import { 
  BlockEvent, 
  Finding, 
  HandleBlock, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent';
import deposit from './deposit';
import withdraw from './withdraw';

const YEARN_PROVIDER: string = '0x437758d475f70249e03eda6be23684ad1fc375f0';

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  return findings;
};

export default {
  handleTransaction,
};
