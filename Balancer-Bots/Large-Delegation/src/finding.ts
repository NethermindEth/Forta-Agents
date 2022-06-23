import { Finding, FindingSeverity, FindingType } from "forta-agent";

export function createFinding(): Finding {
  return Finding.from({
    name: "",
    description: "",
    alertId: "",
    protocol: "",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {},
  });
}
