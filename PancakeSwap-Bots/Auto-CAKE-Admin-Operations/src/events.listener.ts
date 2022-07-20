import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

import { EVENT_ABI } from "./abi";
import { createEventFinding } from "./findings";

export function provideHandleTransaction(contractAddress: string): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for Pause and Unpause events
    const events = txEvent.filterLog(EVENT_ABI, contractAddress);

    events.forEach((event) => {
      findings.push(createEventFinding(event.name));
    });

    return findings;
  };
}
