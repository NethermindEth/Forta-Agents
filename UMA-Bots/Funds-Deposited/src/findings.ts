import { Finding, FindingSeverity, FindingType } from "forta-agent";


export function createFinding(){


   return Finding.fromObject({
        name: "SpokePool Event Emitted",
        description: `High amount of funds: ${5}`,
        alertId: "FORTA-1",
        protocol: "UMA",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
        },
      })
}