import { Finding, FindingSeverity, FindingType } from "forta-agent";

export function createFinding(
  eventType: string,
  l1Token: string,
  oldAmount: number,
  newAmount: number,
  alert = false
): Finding {
  if (eventType === "LiquidityAdded") {
    return Finding.from({
      name: `UMA (Accross-Protocol) HubPool LiquidityAdded Event Emission`,
      description: alert
        ? `New value of liquidity is lower than expected!`
        : `Liquidity has been added into the HubPool.`,
      alertId: alert ? "UMA-6-1" : "UMA-6-2",
      severity: alert ? FindingSeverity.High : FindingSeverity.Info,
      type: alert ? FindingType.Exploit : FindingType.Info,
      protocol: "UMA",
      metadata: {
        l1Token: l1Token,
        oldAmount: oldAmount.toString(),
        newAmount: newAmount.toString(),
        changeInAmount: (newAmount - oldAmount).toString(),
      },
    });
  } else {
    return Finding.from({
      name: `UMA (Accross-Protocol) HubPool LiquidityRemoved Event Emission`,
      description: alert
        ? `New value of liquidity is higher than expected`
        : `Liquidity has been removed from the HubPool.`,
      alertId: alert ? "UMA-6-3" : "UMA-6-4",
      severity: alert ? FindingSeverity.High : FindingSeverity.Info,
      type: alert ? FindingType.Exploit : FindingType.Info,
      protocol: "UMA",
      metadata: {
        l1Token: l1Token,
        oldAmount: oldAmount.toString(),
        newAmount: newAmount.toString(),
        changeInAmount: (newAmount - oldAmount).toString(),
      },
    });
  }
}
