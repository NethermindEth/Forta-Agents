import BigNumber from "bignumber.js";
import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";
import { toBn } from "./utils";

export function createAbsoluteThresholdFinding(
  setDelegateLog: ethers.utils.LogDescription,
  amount: ethers.BigNumber
): Finding {
  const { delegator, delegate } = setDelegateLog.args;

  return Finding.from({
    name: "Large veBAL Delegation",
    description: `A large delegation (in absolute terms) of ${toBn(amount)
      .shiftedBy(-18)
      .toString(10)} veBAL from ${delegator} to ${delegate} was detected`,
    alertId: "BAL-8-1",
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
    name: "Large veBAL Delegation",
    description: `A large delegation (${supplyPercentage.toString(10)}% of veBAL total supply) of ${toBn(amount)
      .shiftedBy(-18)
      .toString(10)} veBAL from ${delegator} to ${delegate} was detected`,
    alertId: "BAL-8-2",
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
