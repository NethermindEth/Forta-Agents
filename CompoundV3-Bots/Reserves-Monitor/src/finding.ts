import { BigNumberish } from "ethers";
import { getAddress } from "ethers/lib/utils";
import { Finding, FindingSeverity, FindingType, Network } from "forta-agent";

export function createFinding(
  chainId: number,
  comet: string,
  reserves: BigNumberish,
  targetReserves: BigNumberish
): Finding {
  return Finding.from({
    name: "Comet reserves reached target reserves",
    description: `Reserves on Comet contract are >= target reserves`,
    alertId: "COMP2-1-1",
    protocol: "Compound",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      chain: Network[chainId] || chainId.toString(),
      comet: getAddress(comet).toLowerCase(),
      reserves: reserves.toString(),
      targetReserves: targetReserves.toString(),
    },
  });
}
