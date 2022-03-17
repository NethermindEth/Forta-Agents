import {
  Finding,
  TransactionEvent,
  HandleTransaction,
} from "forta-agent";

import { createFinding } from "./finding";

// The address of the Paraswap contract (the contract's name is "AugustusSwapper")
const AUGUSTUS_ADDR = "0xdef171fe48cf0115b1d80b88dc8eab59176fee57";

// Function signatures for `multiSwap` and `megaSwap`
const multiPathFuncSigs = ["0xa94e78ef", "0x46c67b6d"];

export const provideHandleTransaction = (paraAddr: string): HandleTransaction => {
  return async (tx: TransactionEvent): Promise<Finding[]> => {
    // Setup the findings array
    const findings: Finding[] = [];

    // For each trace in the transaction
    await Promise.all(
      tx.traces.map(async (trace) => {
        // If the calltype is "delegatecall" and the from address is `address`
        if (trace.action.callType == "delegatecall" && trace.action.from == paraAddr) {
          // Get the function signature used in the call
          const funcSig = trace.action.input.substring(0,10);
          // If the function signature matches `multiSwap` or `megaSwap`
          if(multiPathFuncSigs.includes(funcSig)) {
            // Create a finding
            findings.push(createFinding(trace.action.to));
          }
        }
      })
    );

    // Return all findings
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(AUGUSTUS_ADDR),
};
