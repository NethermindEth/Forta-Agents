import { Finding, FindingSeverity, FindingType } from "forta-agent";

export function createFinding(description:string, metadata:{}, severity:FindingSeverity) {
  return Finding.fromObject({
    name: "CakeToken Event Emitted",
    description: `CakeToken event (${description})`,
    alertId: "FORTA-1",
    protocol:"PancakeSwap",
    severity: severity,
    type: FindingType.Info,
    metadata
  });
}
