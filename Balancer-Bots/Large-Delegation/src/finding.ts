import BigNumber from "bignumber.js";
import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";

export function createAbsoluteThresholdFinding(
  setDelegateLog: ethers.utils.LogDescription,
  amount: ethers.BigNumber
): Finding {
  const { delegator, delegate } = setDelegateLog.args;

  return Finding.from({
    name: "Large Delegation",
    description: "A large delegation (in absolute terms) was detected",
    alertId: "BAL-7-1",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      delegator,
      delegate,
      amount: amount.toString(),
    },
  });
}

export function createPercentageThresholdFinding(
  setDelegateLog: ethers.utils.LogDescription,
  amount: ethers.BigNumber,
  supplyPercentage: BigNumber
): Finding {
  const { delegator, delegate } = setDelegateLog.args;

  return Finding.from({
    name: "Large Delegation",
    description: "A large delegation (relative to veBAL total supply) was detected",
    alertId: "BAL-7-2",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      delegator,
      delegate,
      amount: amount.toString(),
      supplyPercentage: supplyPercentage.toString(10),
    },
  });
}
