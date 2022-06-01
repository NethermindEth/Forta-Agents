import { FindingType } from "forta-agent";
import { FindingSeverity } from "forta-agent";
import { Finding } from "forta-agent";

export const createFinding = (
  from: string,
  address: string,
  entrancyFrom: string,
  initialCall: string,
  reEtrantCall: string
): Finding => {
  return Finding.fromObject({
    name: "Re-entrancy detected on a Trader Joe contract",
    description: "A function call to a trader Joe contract resulted in another call to the same contract",
    alertId: "TraderJoe-25",
    protocol: "TraderJoe",
    severity: FindingSeverity.High,
    type: FindingType.Exploit,
    metadata: {
      from: from,
      initialCall: initialCall, // functions that was called in our contract and resulted in a re-entrancy.
      entrancyFrom: entrancyFrom, // the contract re-entring our contract.
      reEtrantCall: reEtrantCall,
    },
    addresses: [address],
  });
};
