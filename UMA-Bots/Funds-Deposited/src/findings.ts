import { Finding, FindingSeverity, FindingType } from "forta-agent";


export function createFinding(_metadata: {amount:string, originChainId:string, destinationChainId:string, token:string}){


   return Finding.fromObject({
        name: "SpokePool Funds Deposited Event Emitted",
        description: `Deposited ${_metadata.amount} ${_metadata.token}`,
        alertId: "UMA-1-1",
        protocol: "UMA",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: _metadata
      })
}