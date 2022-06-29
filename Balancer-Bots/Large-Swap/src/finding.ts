import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";
import BigNumber from "bignumber.js";

export function createFinding(
  swapLog: ethers.utils.LogDescription,
  percentageIn: BigNumber,
  percentageOut: BigNumber
): Finding {
  const { poolId, tokenIn, tokenOut, amountIn, amountOut } = swapLog.args;

  return Finding.from({
    name: "Large swap",
    description: "A swap that involved a significant percentage of a token's balance was detected",
    alertId: "BAL-3",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      poolId,
      tokenIn,
      tokenOut,
      amountIn: amountIn.toString(),
      amountOut: amountOut.toString(),
      percentageIn: percentageIn.toString(10),
      percentageOut: percentageOut.toString(10),
    },
  });
}
