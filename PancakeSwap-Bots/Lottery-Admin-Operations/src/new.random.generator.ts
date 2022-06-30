import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

import { EVENTS } from "./abi";
import { createEventFinding } from "./findings";

function providerHandleTransaction(contractAddress: string): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for NewRandomGenerator events
    const newRandomGeneratorEvents = txEvent.filterLog(EVENTS.NewRandomGenerator, contractAddress);

    newRandomGeneratorEvents.forEach((newRandomGeneratorEvent) => {
      // extract NewRandomGenerator event arguments
      const { randomGenerator } = newRandomGeneratorEvent.args;

      findings.push(
        createEventFinding(
          newRandomGeneratorEvent.name,
          "Random Generator Address changed",
          randomGenerator
          )
        );
    });

    return findings;
  };
}

export default {
  providerHandleTransaction,
};
