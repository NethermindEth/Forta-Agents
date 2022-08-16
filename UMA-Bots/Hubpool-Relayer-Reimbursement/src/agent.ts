import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import { REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, ADAPTER_TO_CHAIN_NAME } from "./constants";
import { createBotFinding } from "./helpers";

export function provideHandleTransaction(
  reimbursementEvent: string,
  hubpoolAddress: string,
  adapterToChainName: {}
): HandleTransaction {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    const reimbursementEventTxns = txEvent.filterLog(reimbursementEvent, hubpoolAddress);
    reimbursementEventTxns.forEach((singleReimbursementEvent) => {
      const { l1Token, l2Token, amount, to } = singleReimbursementEvent.args;

      findings.push(
        createBotFinding(
          l1Token.toString(),
          l2Token.toString(),
          amount.toString(),
          to.toString(),
          adapterToChainName[to as keyof typeof adapterToChainName],
        )
      );
    });
    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(REIMBURSEMENT_EVENT, HUBPOOL_ADDRESS, ADAPTER_TO_CHAIN_NAME)
};
