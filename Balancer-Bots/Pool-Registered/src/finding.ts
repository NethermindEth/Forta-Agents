import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";
import { PoolSpecialization } from "./utils";

export function createFinding(poolRegisteredLog: ethers.utils.LogDescription): Finding {
  const { poolId, poolAddress, specialization } = poolRegisteredLog.args;

  return Finding.from({
    name: "Pool registered",
    description: "A pool register was detected",
    alertId: "BAL-6",
    protocol: "Balancer",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      poolId,
      poolAddress,
      specialization: PoolSpecialization[specialization],
    },
  });
}
