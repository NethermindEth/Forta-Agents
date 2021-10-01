import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType
} from "forta-agent";
import FailureCounter from "./failure.counter";

export const HIGH_FAILURE_THRESHOLD: number = 50;
export const TIME_INTERVAL: number = 60; // 1 hour
export const INTERSTING_PROTOCOLS: string[] = [
  "0xacd43e627e64355f1861cec6d3a6688b31a6f952", // Yearn Dai vault
  "0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b", // OpenSea
  "0x11111112542D85B3EF69AE05771c2dCCff4fAa26", // 1inch V3
  "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", // SushiSwap: Router
  "0xA0c68C638235ee32657e8f720a23ceC1bFc77C77", // Polygon (Matic) Bridge
  "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2
  "0xa5409ec958C83C3f309868babACA7c86DCB077c1", // OpenSea: Registry
  "0x3845badAde8e6dFF049820680d1F14bD3903a5d0" // The Sandbox Token
];

const failureCounter: FailureCounter = new FailureCounter(
  TIME_INTERVAL,
  HIGH_FAILURE_THRESHOLD + 5
);

export const createFinding = (addr: string, txns: string[]): Finding =>
  Finding.fromObject({
    name: "High Volume of Failed Txn Detection",
    description: "High Volume of Failed Transactions are detected.",
    alertId: "NETHFORTA-3",
    type: FindingType.Suspicious,
    severity: FindingSeverity.High,
    metadata: {
      count: txns.length.toString(),
      address: addr,
      transactions: JSON.stringify(txns)
    }
  });

function provideHandleTransaction(
  counter: FailureCounter,
  protocols: string[]
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    // report finding if a high volume of failed transaccion ocur within a defined time interval
    const findings: Finding[] = [];

    if (txEvent.status !== false) return findings;

    const involvedProtocols = protocols.filter(
      (addr) => txEvent.addresses[addr.toLowerCase()]
    );
    involvedProtocols.forEach((addr) => {
      const amount = counter.failure(addr, txEvent.hash, txEvent.timestamp);
      if (amount > HIGH_FAILURE_THRESHOLD) {
        findings.push(createFinding(addr, counter.getTransactions(addr)));
      }
    });

    return findings;
  };
}

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(failureCounter, INTERSTING_PROTOCOLS)
};
