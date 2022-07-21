import BigNumber from "bignumber.js";
import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";
import { toBn } from "./utils";

export function createFinding(
  flashLoanLog: ethers.utils.LogDescription,
  tvlPercentage: BigNumber,
  symbol: string,
  decimals: number
): Finding {
  const { recipient, token, amount } = flashLoanLog.args;

  return Finding.from({
    name: "Large flash loan",
    description: `A flash loan to ${recipient} of ${toBn(amount)
      .shiftedBy(-decimals)
      .decimalPlaces(3)} ${symbol}, was detected. The amount made up ${tvlPercentage.decimalPlaces(3)}% of the TVL.`,
    alertId: "BAL-4",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      recipient,
      token,
      symbol,
      amount: amount.toString(),
      tvlPercentage: tvlPercentage.toString(10),
    },
  });
}
