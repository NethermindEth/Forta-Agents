import { HandleTransaction, TransactionEvent } from "forta-agent";

import newGeneratorAgent from "./new.random.generator";
import newOperatorAgent from "./new.operator.and.treasury.and.injector.address";
import functionCallAgent from "./function.call.listener";

let findingsCount = 0;

function provideHandleTransaction(
  newGeneratorAgent: any,
  newOperatorAgent: any,
  functionCallAgent: any
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    //limit findings to 5 to avoid a spammed alert feed
    if (findingsCount >= 5) return [];

    const findings = (
      await Promise.all([
        newGeneratorAgent.handleTransaction(txEvent),
        newOperatorAgent.handleTransaction(txEvent),
        functionCallAgent.handleTransaction(txEvent),
      ])
    ).flat();

    findingsCount = findings.length;
    return findings;
  };
}

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(newGeneratorAgent, newOperatorAgent, functionCallAgent),
};
