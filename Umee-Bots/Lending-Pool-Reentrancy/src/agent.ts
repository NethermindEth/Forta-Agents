import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

import CONFIG from "./agent.config";

import utils, { AgentConfig } from "./utils";

export const provideHandleTransaction = (config: AgentConfig): HandleTransaction => {
  const sigHashes = utils.getSigHashes(config.reentrancyBlacklist);
  const lendingPoolAddress = config.lendingPoolAddress.toLowerCase();
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const { traces } = txEvent;
    for (let i = 0; i < traces.length; i++) {
      const trace = traces[i];
      const depth = trace.traceAddress.length;
      if (trace.action.to === lendingPoolAddress) {
        let alerted = false;
        for (i = i + 1; i < traces.length; i++) {
          if (traces[i].traceAddress.length <= depth) {
            i--;
            break; // subtree ended, non reentrant call
          }
          if (!alerted && traces[i].action.to === config.lendingPoolAddress) {
            const selector = (traces[i].action.input || "").slice(0, 10); // "0x" and first 4 bytes
            if (sigHashes.includes(selector)) {
              const initialCallSelector = (trace.action.input || "").slice(0, 10);
              findings.push(utils.createFinding(initialCallSelector, selector));
              alerted = true;
            }
          }
        }
      }
    }
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(CONFIG),
};
