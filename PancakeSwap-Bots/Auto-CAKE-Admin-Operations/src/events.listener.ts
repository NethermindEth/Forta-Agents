import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

import { EVENTS } from "./abi";
import { createEventFinding } from "./findings";

function provideHandleTransaction(contractAddress: string): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for Pause and Unpause events
    const events = txEvent.filterLog(EVENTS, contractAddress);

    events.forEach((event) => {
      findings.push(createEventFinding(event.name, {}));
    });

    return findings;
  };
}

export default {
  provideHandleTransaction,
};
