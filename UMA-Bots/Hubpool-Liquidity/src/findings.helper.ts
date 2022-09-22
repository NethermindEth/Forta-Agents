import { Finding, FindingSeverity, FindingType } from "forta-agent";

export function createFinding(l1Token: string, oldAmount: number, currentAmount: number): Finding {
  return Finding.from({
    name: "UMA (Accross-Protocol) HubPool LiquidityRemoved Event Emission",
    description: "Liquidity from the HubPool Contract has dropped by more than 10% over the last 24 hours",
    alertId: "UMA-6-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "UMA",
    metadata: {
      l1Token: l1Token.toLocaleLowerCase(),
      oldAmount: oldAmount.toString(),
      currentAmount: currentAmount.toString(),
      changeInAmount: (currentAmount - oldAmount).toString(),
    },
  });
}
