import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";

import utils from "./utils";

export const handleTransaction =
  (contractAddress: string, reentrancyFunctionsSelectors: string[]): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const { traces } = txEvent;
    for (let i = 0; i < traces.length; i++) {
      const trace = traces[i];
      const depth = trace.traceAddress.length;
      if (trace.action.to === contractAddress) {
        let j;

        for (j = i + 1; j < traces.length; j++) {
          if (traces[j].traceAddress.length <= depth) {
            i = j - 1;
            continue; // subtree ended, non reentrant call
          }

          if (traces[j].action.to === contractAddress) {
            const selector = (traces[j].action.input || "").slice(0, 10); // "0x" and first 4 bytes
            if (reentrancyFunctionsSelectors.includes(selector)) {
              const initialCallSelector = (txEvent.transaction.data || "").slice(0, 10);
              findings.push(utils.createFinding(initialCallSelector, selector));
              break;
            }
          }
        }
      }
    }
    return findings;
  };

export default {
  handleTransaction: handleTransaction(utils.LENDING_POOL_ADDRESS, utils.REENTRANCY_FUNCTIONS_SELECTORS),
};
