import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { MODULE_ADDRESSES, EVENTS } from "./utils";
import { createFinding } from "./findings";

export function provideHandleTransaction(proxyAddresses: string[]): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    txEvent.filterLog(EVENTS, proxyAddresses).map((log) => {
      findings.push(createFinding(log.name, log.args, log.address));
    });

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(MODULE_ADDRESSES),
};
