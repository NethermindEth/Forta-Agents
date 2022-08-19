import { Finding, FindingSeverity, FindingType } from "forta-agent";

export function createBotFinding(
  findingL1TokenAddr: string,
  findingReceivingTokenAddr: string,
  findingAmount: string,
  findingToAddr: string,
  findingChainName: string
): Finding {
  return Finding.from({
    name: "Relayer Reimbursement",
    description: "A token transfer took place from the l1 HubPool for Relayer reimbursement to a SpokePool",
    alertId: "UMA-4",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    protocol: "UMA",
    metadata: {
      l1Token: findingL1TokenAddr,
      receivingToken: findingReceivingTokenAddr,
      amount: findingAmount,
      to: findingToAddr,
      chainName: findingChainName,
    },
  });
}