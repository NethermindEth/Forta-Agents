import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import {
  REIMBURSEMENT_EVENT,
  HUBPOOL_ADDRESS,
  ADAPTER_TO_CHAIN_NAME,
} from "./constants";

export function provideHandleTransaction(
  reimbursementEvent: string,
  hubpoolAddress: string,
  adapterToChainName: {}
): HandleTransaction {
  const findings: Finding[] = [];
  return async (txEvent: TransactionEvent) => {
    const remibursementEventTxns = txEvent.filterLog(
      reimbursementEvent,
      hubpoolAddress
    );
    remibursementEventTxns.forEach((singleReimbursementEvent) => {
      const { l1Token, l2Token, amount, to } = singleReimbursementEvent.args;

      findings.push(
        Finding.fromObject({
          name: "Relayer Reimbursement",
          description: `A token transfer took place from the l1 HubPool for Relayer reimbursement to a spokePool`,
          alertId: "UMA-REIMB",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          protocol: "Across v2",
          metadata: {
            l1Token: l1Token.toString(),
            l2Token: l2Token.toString(),
            amount: amount.toString(),
            to: to.toString(),
            chainName:
              adapterToChainName[to as keyof typeof adapterToChainName],
          },
        })
      );
    });
    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(
    REIMBURSEMENT_EVENT,
    HUBPOOL_ADDRESS,
    ADAPTER_TO_CHAIN_NAME
  ),
  // handleBlock
};
