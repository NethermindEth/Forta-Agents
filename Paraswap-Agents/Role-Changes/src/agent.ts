import { Finding, HandleTransaction, TransactionEvent, LogDescription } from "forta-agent";

import { createFinding, EVENTS_ABI, SWAPPER_CONTRACT } from "./utils";

export const provideHandleTransaction =
  (swapperContract: string): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    const logs: LogDescription[] = txEvent.filterLog(EVENTS_ABI, swapperContract);

    logs.forEach((log) => {
      findings.push(createFinding(log));
    });

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(SWAPPER_CONTRACT),
};
