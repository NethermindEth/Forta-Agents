import { Finding, FindingSeverity, FindingType } from "forta-agent";

export interface AgentConfig {
  lendingPoolAddress: string;
  reentrancyBlacklist: string[];
}

const createFinding = (initialCall: string, reentrantCall: string): Finding => {
  return Finding.fromObject({
    name: "LendingPool call reentrancy",
    description: "Reentrancy detected in call to LendingPool contract",
    alertId: "UMEE-9",
    protocol: "Umee",
    type: FindingType.Exploit,
    severity: FindingSeverity.High,
    metadata: {
      initialCall,
      reentrantCall,
    },
  });
};

export default {
  createFinding,
};
