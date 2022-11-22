import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { AgentConfig, PAUSE_EVENTS_ABIS } from "./utils";
import { createFinding } from "./finding";
import CONFIG from "./agent.config";

export const provideHandleTransaction = (config: AgentConfig): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    txEvent
      .filterLog(PAUSE_EVENTS_ABIS, config.compoundComptrollerAddress)
      .forEach(log => {
        findings.push(createFinding(log));
      });

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(CONFIG),
};
