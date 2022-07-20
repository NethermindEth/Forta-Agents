import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";
import BigNumber from "bignumber.js";
import { toBn } from "./utils";

export function createFinding(
  swapLog: ethers.utils.LogDescription,
  percentageIn: BigNumber,
  percentageOut: BigNumber,
  tokenInSymbol: string,
  tokenOutSymbol: string,
  tokenInDecimals: number,
  tokenOutDecimals: number
): Finding {
  const { poolId, tokenIn, tokenOut, amountIn, amountOut } = swapLog.args;

  return Finding.from({
    name: "Large swap",
    description: `A swap of ${toBn(amountIn)
      .shiftedBy(-tokenInDecimals)
      .decimalPlaces(3)} ${tokenInSymbol}, (${percentageIn.decimalPlaces(3)}% of ${tokenInSymbol}'s balance) for ${toBn(
      amountOut
    )
      .shiftedBy(-tokenOutDecimals)
      .decimalPlaces(3)} ${tokenOutSymbol} (${percentageOut.decimalPlaces(
      3
    )}% of ${tokenOutSymbol}'s balance) was detected. The poolId is ${poolId}.`,
    alertId: "BAL-3",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Unknown,
    metadata: {
      poolId,
      tokenIn,
      tokenInSymbol,
      tokenOut,
      tokenOutSymbol,
      amountIn: amountIn.toString(),
      amountOut: amountOut.toString(),
      percentageIn: percentageIn.toString(10),
      percentageOut: percentageOut.toString(10),
    },
  });
}
