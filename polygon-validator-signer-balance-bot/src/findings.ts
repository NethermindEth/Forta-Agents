import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { MINIMUM_THRESHOLD } from "./constants";

export const createUnderThresholdFinding = (balance: string) => {
  return Finding.fromObject({
    name: "Account balance below threshold!",
    description: `Account balance (${balance.toString()}) below threshold (${MINIMUM_THRESHOLD})`,
    alertId: "POLY01",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "POLYGON-VALIDATOR-SIGNER-BOT",
    metadata: {
      balance: balance,
    },
  });
};

export const createOverThresholdFinding = (balance: string) => {
  return Finding.fromObject({
    name: "Account balance greater than threshold!",
    description: `Account balance (${balance.toString()}) above threshold (${MINIMUM_THRESHOLD})`,
    alertId: "POLY01",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "POLYGON-VALIDATOR-SIGNER-BOT",
    metadata: {
      balance: balance,
    },
  });
};
