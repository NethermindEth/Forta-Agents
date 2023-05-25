import { ethers, Finding, FindingSeverity, FindingType, Network } from "forta-agent";

export function createAbsorbFinding(
  comet: string,
  absorber: string,
  borrower: string,
  basePaidOut: ethers.BigNumberish,
  chainId: number,
  block: number
): Finding {
  return Finding.from({
    name: "Large borrow position absorption on Comet contract",
    description: "A large borrow position was absorbed in a Comet contract",
    alertId: "COMP2-4-1",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Medium,
    metadata: {
      block: block.toString(),
      chain: Network[chainId] || chainId.toString(),
      comet: ethers.utils.getAddress(comet),
      absorber: ethers.utils.getAddress(absorber),
      borrower: ethers.utils.getAddress(borrower),
      basePaidOut: basePaidOut.toString(),
    },
    addresses: [ethers.utils.getAddress(comet), ethers.utils.getAddress(absorber), ethers.utils.getAddress(borrower)],
  });
}

export function createLiquidationRiskFinding(
  comet: string,
  borrower: string,
  positionSize: ethers.BigNumberish,
  chainId: number,
  block: number
): Finding {
  return Finding.from({
    name: "Large borrow position not collateralized on Comet contract",
    description: "A large borrow position exceeded the borrowCollateralFactor and is at risk in a Comet contract",
    alertId: "COMP2-4-2",
    protocol: "Compound",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      block: block.toString(),
      chain: Network[chainId] || chainId.toString(),
      comet: ethers.utils.getAddress(comet),
      borrower: ethers.utils.getAddress(borrower),
      positionSize: positionSize.toString(),
    },
    addresses: [ethers.utils.getAddress(comet), ethers.utils.getAddress(borrower)],
  });
}
