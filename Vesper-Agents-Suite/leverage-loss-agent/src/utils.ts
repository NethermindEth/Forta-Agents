import { Finding, FindingType, FindingSeverity } from "forta-agent";

export const createFinding = (strategyAddress: any, lossMaking: any): Finding => {
  return Finding.fromObject({
    name: "Leverage Negative APY",
    description:
      "Leverage Strategy is loss making",
    alertId: "Vesper-3",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Vesper",
    metadata: {
      strategyAddress,
      isLossMaking: lossMaking
    },
  });
};