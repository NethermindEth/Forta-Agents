import { ethers, Finding, FindingSeverity, FindingType, LogDescription, Network } from "forta-agent";

export function createAbsorbFinding(
  comet: string,
  borrower: string,
  positionSize: ethers.BigNumberish,
  chainId: number
): Finding {
  return Finding.from({
    name: "Large borrow position absorption on Comet contract",
    description: "A large borrow position was absorbed in a Comet contract",
    alertId: "COMP2-4-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      comet: ethers.utils.getAddress(comet),
      borrower: ethers.utils.getAddress(borrower),
      positionSize: positionSize.toString(),
    },
    addresses: [ethers.utils.getAddress(comet), ethers.utils.getAddress(borrower)],
  });
}

export function createLiquidationRiskFinding(
  comet: string,
  borrower: string,
  positionSize: ethers.BigNumberish,
  chainId: number
): Finding {
  return Finding.from({
    name: "Large borrow position not collateralized on Comet contract",
    description: "A large borrow position exceeded the borrowCollateralFactor and is at risk in a Comet contract",
    alertId: "COMP2-4-2",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      comet: ethers.utils.getAddress(comet),
      borrower: ethers.utils.getAddress(borrower),
      positionSize: positionSize.toString(),
    },
    addresses: [ethers.utils.getAddress(comet), ethers.utils.getAddress(borrower)],
  });
}
