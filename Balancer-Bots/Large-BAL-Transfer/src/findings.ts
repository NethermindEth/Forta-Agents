import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { BigNumber } from "bignumber.js";

export const createFinding = (from: string, to: string, value: BigNumber, percentage: BigNumber): Finding => {
  return Finding.from({
    name: "Large BAL Transfer",
    description: `${value.shiftedBy(-18).decimalPlaces(5)} BAL (${percentage.decimalPlaces(
      5
    )}% of the total supply) transferred from ${from} to ${to}`,
    alertId: "BAL-7",
    protocol: "Balancer",
    severity: FindingSeverity.Low,
    type: FindingType.Info,
    metadata: {
      from,
      to,
      value: value.toString(10),
      percentage: percentage.toString(10),
    },
  });
};
