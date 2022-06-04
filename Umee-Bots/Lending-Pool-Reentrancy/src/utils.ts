import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { encodeFunctionSignature } from "forta-agent-tools/lib/utils";

export interface AgentConfig {
  lendingPoolAddress: string;
  reentrancyBlacklist: string[];
}

const getSigHashes = (signaturesArray: string[]): string[] => {
  return signaturesArray.map((signature) => {
    return encodeFunctionSignature(signature);
  });
};

const createFinding = (initialCallSelector: string, reentrantCallSelector: string): Finding => {
  return Finding.fromObject({
    name: "LendingPool call reentrancy",
    description: "Reentrancy detected in call to LendingPool contract",
    alertId: "UMEE-9",
    protocol: "Umee",
    type: FindingType.Exploit,
    severity: FindingSeverity.High,
    metadata: {
      initialCallSelector,
      reentrantCallSelector,
    },
  });
};
export default {
  getSigHashes,
  createFinding,
};
