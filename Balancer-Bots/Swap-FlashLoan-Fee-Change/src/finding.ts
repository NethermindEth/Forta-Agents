import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";

export function createFinding(feeFrom: "FlashLoan" | "Swap", newFee: ethers.BigNumber): Finding {
  return Finding.from({
    name: `${feeFrom} fee changed`,
    description: `A ${feeFrom} fee percentage change was detected`,
    alertId: feeFrom === "FlashLoan" ? "BAL-1-1" : "BAL-1-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Balancer",
    metadata: {
      // the fee value is a 18-decimal fixed point number, so by shifting left 16 places the result is the actual %
      newFeePercentage: ethers.utils.formatUnits(newFee, 16),
    },
  });
}
