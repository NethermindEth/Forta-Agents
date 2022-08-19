import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { DISPUTE_EVENT, HUBPOOL_ADDRESS } from "./constants";
import { getFindingInstance } from "./helpers";

export function provideHandleTransaction(disputeEvent: string, hubPoolAddress: string): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const disputeEventTxns = txEvent.filterLog(disputeEvent, hubPoolAddress);
    disputeEventTxns.forEach((disputeActualEvent) => {
      const { disputer, requestTime } = disputeActualEvent.args;
      findings.push(getFindingInstance(disputer.toString(), requestTime.toString()));
    });
    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(DISPUTE_EVENT, HUBPOOL_ADDRESS),
  // handleBlock
};
