import { Finding, FindingSeverity, FindingType } from "forta-agent";

export function createFinding(delegate: string, previousBalance: string, newBalance: string) {
  return Finding.fromObject({
    name: "High Tether Transfer",
    description: `High amount of USDT transferred: ${1}`,
    alertId: "FORTA-1",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    metadata: {
      delegate,
      previousBalance,
      newBalance,
    },
  });
}
