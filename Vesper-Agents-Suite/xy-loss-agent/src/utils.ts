import { Finding, FindingType, FindingSeverity } from "forta-agent";

export const createFinding = (strategyAddress: any, lossMaking: any): Finding => {
  return Finding.fromObject({
    name: "XY Strategy Negative APY",
    description:
      "XY Strategy is loss making",
    alertId: "Vesper-3",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Vesper",
    metadata: {
      strategyAddress
    },
  });
};