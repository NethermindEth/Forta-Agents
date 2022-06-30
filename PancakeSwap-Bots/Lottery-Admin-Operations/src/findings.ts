import { Finding, FindingType, FindingSeverity } from "forta-agent";



export const createFinding = (_name:string, _description:string, _metadata:{} ) => {

    Finding.fromObject({
        name: _name,
        description: `PancakeSwapLottery: ${_description}`,
        alertId: "CAKE-8-1",
        protocol: "PancakeSwap",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: _metadata
    })

    }
