import { FindingType } from "forta-agent";
import { FindingSeverity } from "forta-agent";
import { Finding } from "forta-agent";
import { FUNCTIONS_MAP } from "./utils";

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
      initialCall: FUNCTIONS_MAP.get(initialCall)?.slice(9) as string,
      reentrancyFrom: entrancyFrom,
      reetrantCall: FUNCTIONS_MAP.get(reEtrantCall)
        ? (FUNCTIONS_MAP.get(reEtrantCall)?.slice(9) as string)
        : reEtrantCall,
    },
    addresses: [address],
  });
};
