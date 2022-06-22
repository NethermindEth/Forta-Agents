import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";

export interface AgentConfig {
  vaultAddress: string;
}

export enum PoolSpecialization {
  GENERAL = 0,
  MINIMAL_SWAP_INFO = 1,
  TWO_TOKEN = 2,
}

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
