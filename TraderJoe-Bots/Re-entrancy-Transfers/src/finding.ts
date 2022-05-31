import { FindingType } from "forta-agent";
import { FindingSeverity } from "forta-agent";
import { Finding } from "forta-agent";

export const createFinding = (address: string, from: string, initialCall: string, reEtrantCall: string): Finding => {
  return Finding.fromObject({
    name: "Re-entrancy detected on a Trader Joe contract",
    description: "Re-entrancy detected on a Trader Joe contract",
    alertId: "TraderJoe-25",
    protocol: "TraderJoe",
    severity: FindingSeverity.High,
    type: FindingType.Exploit,
    metadata: {
      from: from, // the contract re-entring our contract.
      initialCall: initialCall, // functions that was called in our contract and resulted in a re-entrancy.
      reEtrantCall: reEtrantCall,
    },
    addresses: [address],
  });
};
