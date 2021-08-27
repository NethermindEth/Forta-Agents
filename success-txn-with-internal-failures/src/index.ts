import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType, 
  Trace,
} from 'forta-agent';

export const createFinding = (amount: number): Finding =>
  Finding.fromObject({
    name: "Successful txn with internal failures",
    description: `${amount} internal failed transactions`,
    alertId: "NETHFORTA-19",
    type: FindingType.Suspicious,
    severity: FindingSeverity.High,
  });

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = [];

  if(!txEvent.status) return findings;

  let internalFailureCount: number = 0;
  txEvent.traces.forEach(
    (trace: Trace) => {
      if(trace.error === "Reverted")
        ++internalFailureCount;
    },
  );  

  if(internalFailureCount){
    findings.push(createFinding(internalFailureCount));
  }
  return findings;
};

export default {
  handleTransaction,
};
