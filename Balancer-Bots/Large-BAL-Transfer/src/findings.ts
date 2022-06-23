import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { BigNumber } from "bignumber.js";

export const createFinding = (from: string, to: string, value: BigNumber, percentage: BigNumber): Finding => {
  return Finding.from({
    name: "Large BAL Transfer",
    description: "Large amount of BAL transferred",
    alertId: "BAL-7",
    protocol: "Balancer",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    metadata: {
      from,
      to,
      value: value.toString(),
      percentage: percentage.toString(),
    },
  });
};
