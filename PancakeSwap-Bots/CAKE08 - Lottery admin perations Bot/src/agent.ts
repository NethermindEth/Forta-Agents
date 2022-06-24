import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";

import newRandomGenerator from "./new.random.generator"

let findingsCount = 0;

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {

  const findings = (
    await Promise.all([
      newRandomGenerator.handleTransaction(txEvent),
    ])
  ).flat();

  findingsCount++;
    

  return findings;
};

export default {
  handleTransaction
 
};
