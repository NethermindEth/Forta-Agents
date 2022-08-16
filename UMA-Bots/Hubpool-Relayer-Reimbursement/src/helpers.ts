import { Finding, FindingSeverity, FindingType } from "forta-agent";

export function createBotFinding(
    findingL1TokenAddr: string,
    findingl2TokenAddr: string,
    findingAmount: string,
    findingToAddr: string,
    findingChainName: string
  ): Finding {
    return Finding.from({
      name: "Relayer Reimbursement",
      description: `A token transfer took place from the l1 HubPool for Relayer reimbursement to a spokePool`,
      alertId: "UMA-REIMB",
      severity: FindingSeverity.Low,
      type: FindingType.Info,
      protocol: "Across v2",
      metadata: {
        l1Token: findingL1TokenAddr,
        l2Token: findingl2TokenAddr,
        amount: findingAmount,
        to: findingToAddr,
        chainName: findingChainName,
      },
    });
  }