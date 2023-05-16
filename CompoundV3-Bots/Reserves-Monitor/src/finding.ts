import {
  ethers,
  Finding,
  FindingSeverity,
  FindingType,
  Network,
} from "forta-agent";

export function createFinding(
  chainId: number,
  comet: string,
  reserves: ethers.BigNumberish,
  targetReserves: ethers.BigNumberish
): Finding {
  return Finding.from({
    name: "Comet reserves reached target reserves",
    description: "Reserves on Comet contract are >= target reserves",
    alertId: "COMP2-1-1",
    protocol: "Compound",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      comet: ethers.utils.getAddress(comet),
      reserves: reserves.toString(),
      targetReserves: targetReserves.toString(),
    },
    addresses: [ethers.utils.getAddress(comet)],
  });
}
