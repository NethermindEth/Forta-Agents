import {
  HandleTransaction,
  TransactionEvent
} from "forta-agent";

import newRandomGenerator from "./new.random.generator"
import newOperatorAndTreasuryAndInjectorAddresses from "./new.operator.and.treasury.and.injector.address"
import functionCallListener from "./function.call.listener"

let findingsCount = 0;

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {

  const findings = (
    await Promise.all([
      newRandomGenerator.handleTransaction(txEvent),
      newOperatorAndTreasuryAndInjectorAddresses.handleTransaction(txEvent),
      functionCallListener.handleTransaction(txEvent)

    ])
  ).flat();

  findingsCount++;
    

  return findings;
};

export default {
  handleTransaction
 
};
