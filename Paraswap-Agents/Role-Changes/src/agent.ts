import { Finding, HandleTransaction, TransactionEvent, LogDescription } from "forta-agent";

import { createFinding, EVENTS_SIGNATURES, CONTRACT } from "./utils";

export const provideHandleTransaction =
  (contract: string): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs: LogDescription[] = txEvent.filterLog(EVENTS_SIGNATURES, contract);
    if (logs.length === 0) return findings;

    logs.forEach((log) => {
      findings.push(createFinding(log));
    });

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(CONTRACT),
};
