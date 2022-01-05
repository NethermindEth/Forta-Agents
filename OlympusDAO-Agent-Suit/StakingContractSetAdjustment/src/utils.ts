import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (
  index: string,
  add: string,
  rate: string,
  target: string
): Finding => {
  return Finding.fromObject({
    name: "af",
    description: "s",
    alertId: "sf",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "OlympusDAO",
    metadata: {
      _index: index,
      _add: add,
      _rate: rate,
      _target: target,
    },
  });
};
