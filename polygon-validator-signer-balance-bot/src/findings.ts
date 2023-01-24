import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { MINIMUM_THRESHOLD } from "./constants";

export const createUnderThresholdFinding = (balance: string) => {
  console.log(MINIMUM_THRESHOLD.toString());
  return Finding.fromObject({
    name: "Account balance below threshold!",
    description: `Account balance (${balance}) below threshold (${MINIMUM_THRESHOLD.toString()})`,
    alertId: "POLY-01",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      balance: balance,
    },
  });
};

export const createOverThresholdFinding = (balance: string) => {
  return Finding.fromObject({
    name: "Account balance greater than threshold!",
    description: `Account balance (${balance}) above threshold (${MINIMUM_THRESHOLD.toString()})`,
    alertId: "POLY-02",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      balance: balance,
    },
  });
};
