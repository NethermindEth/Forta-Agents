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

const createFinding = (initialCallSelector: string, lendingPoolCallSelector: string): Finding => {
  return Finding.fromObject({
    name: "Detect Lending Pool Reentrancy",
    description: "Detect when a reentrancy happened in the LendingPool contract",
    alertId: "UMEE-9",
    type: FindingType.Exploit,
    severity: FindingSeverity.High,
    metadata: {
      initialCallSelector,
      lendingPoolCallSelector,
    },
  });
};
export default {
  getSigHashes,
  createFinding,
};
