import { Finding, FindingSeverity, FindingType } from "forta-agent";

export function getFindingInstance(eventArgs: {}) {
  return Finding.fromObject({
    name: "Configuration Changed",
    description: `HubPool configuration changed`,
    alertId: "UMA-3",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    protocol: "UMA",
    metadata: eventArgs,
  });
}
