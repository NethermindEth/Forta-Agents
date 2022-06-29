import BigNumber from "bignumber.js";
import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";

export function createFinding(flashLoanLog: ethers.utils.LogDescription, tvlPercentage: BigNumber): Finding {
  const { recipient, token, amount } = flashLoanLog.args;

  return Finding.from({
    name: "Large flash loan",
    description: "A flash loan that involved a significant percentage of a token's balance was detected",
    alertId: "BAL-4",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      recipient,
      token,
      amount: amount.toString(),
      tvlPercentage: tvlPercentage.toString(10),
    },
  });
}
