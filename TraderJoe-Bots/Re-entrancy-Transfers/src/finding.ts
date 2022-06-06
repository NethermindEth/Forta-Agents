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
    description: "A function call to a Trader Joe contract resulted in another call to the same contract",
    alertId: "TRADERJOE-25",
    protocol: "TraderJoe",
    severity: FindingSeverity.High,
    type: FindingType.Exploit,
    metadata: {
      from: from,
      initialCall: initialCall,
      entrancyFrom: entrancyFrom,
      reEtrantCall: reEtrantCall,
    },
    addresses: [address],
  });
};
