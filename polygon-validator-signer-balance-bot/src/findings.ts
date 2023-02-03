import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { MINIMUM_THRESHOLD_TO_ETHER } from "./constants";

export const createUnderThresholdFinding = (balance: string) => {
  return Finding.fromObject({
    name: "Account balance below threshold!",
    description: `Account balance (${balance} ETH) below threshold (${MINIMUM_THRESHOLD_TO_ETHER} ETH)`,
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
    description: `Account balance (${balance} ETH) above threshold (${MINIMUM_THRESHOLD_TO_ETHER} ETH)`,
    alertId: "POLY-02",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      balance: balance,
    },
  });
};
