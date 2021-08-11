import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent';
import FailureCounter from './failure.counter';

export const HIGH_FAILURE_THRESHOLD: number = 50;
export const TIME_INTERVAL: number = 60; // 1 hour
export const INTERSTING_PROTOCOLS: string[] = [
  "0xacd43e627e64355f1861cec6d3a6688b31a6f952", // Yearn Dai vault
];

const failureCounter: FailureCounter = new FailureCounter(TIME_INTERVAL);

function provideHandleTransaction(
  counter: FailureCounter, 
  protocols: string[]
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    // report finding if a high volume of failed transaccion ocur within a defined time interval
    const findings: Finding[] = [];

    if(txEvent.status) return findings;

    const involvedProtocols = protocols.filter((addr) => txEvent.addresses[addr]);
    involvedProtocols.forEach((addr) => {
      const amount = counter.failure(addr, txEvent.hash, txEvent.timestamp);
      if(amount > HIGH_FAILURE_THRESHOLD) {
        findings.push(
          Finding.fromObject({
            name: "High volume of failed TXs",
            description: `High failed transactions volume (${amount}) related with ${addr} protocol`,
            alertId: "NETHERMIND-AGENTS",
            type: FindingType.Suspicious,
            severity: FindingSeverity.High,
            protocol: addr,
            metadata: {
              transactions: JSON.stringify(counter.getTransactions(addr)),
            },
          })
        );
      }
    });

    return findings;
  };
};

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(failureCounter, INTERSTING_PROTOCOLS),
};
