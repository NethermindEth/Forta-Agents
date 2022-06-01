import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

import CONFIG from "./agent.config";

import utils, { AgentConfig } from "./utils";

export const provideHandleTransaction = (config: AgentConfig): HandleTransaction => {
  const sigHashes = utils.getSigHashes(config.reentrancyBlacklist);

  const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const { traces } = txEvent;
    for (let i = 0; i < traces.length; i++) {
      const trace = traces[i];
      const depth = trace.traceAddress.length;
      if (trace.action.to === config.lendingPoolAddress) {
        let alerted = false;
        for (let j = i + 1; j < traces.length; j++) {
          if (traces[j].traceAddress.length <= depth) {
            i = j - 1;
            break; // subtree ended, non reentrant call
          }

          if (traces[j].action.to === config.lendingPoolAddress && !alerted) {
            const selector = (traces[j].action.input || "").slice(0, 10); // "0x" and first 4 bytes
            if (sigHashes.includes(selector)) {
              const initialCallSelector = (txEvent.transaction.data || "").slice(0, 10);
              findings.push(utils.createFinding(initialCallSelector, selector));
              alerted = true;
            }
          }
        }
      }
    }
    return findings;
  };
  return handleTransaction;
};

export default {
  handleTransaction: provideHandleTransaction(CONFIG),
};
