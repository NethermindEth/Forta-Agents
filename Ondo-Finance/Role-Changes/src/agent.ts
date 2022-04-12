import { Finding, HandleTransaction, Trace, TransactionEvent } from "forta-agent";
import abi from "./abi";
import { utils } from "ethers";
import { createFinding } from "./findings";

const REGISTRY: string = "0xf69c52bf2cf76250647c0bb5390d4ba8854a1d4a";

const provideHandleTransaction =
  (registry: string): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    // manually iterating the traces to get the sender of each call
    txEvent.traces.forEach((trace: Trace) => {
      if(trace.action.to !== registry) return;

      const txn = {
        data:  trace.action.input,
        value: trace.action.value,
        to:    trace.action.to,
      };

      try {
        const desc: utils.TransactionDescription = abi.REGISTRY_IFACE.parseTransaction(txn);
        findings.push(createFinding(desc, trace.action.from));
      }
      catch (_) {}
    });

    return findings;
  };

export default {
  handleTransaction: provideHandleTransaction(REGISTRY),
  provideHandleTransaction,
};
