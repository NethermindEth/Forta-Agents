import { Finding, FindingType, FindingSeverity } from "forta-agent";
import { ALERTS } from "./abi";



export const createEventFinding = ( _name:string, _description:string,  _metadata:{} ) => {

    return Finding.fromObject({
        name: `Event: ${(_name === "NewRandomGenerator") ? "NewRandomGenerator" : _name }`,
        description: `PancakeSwapLottery: ${_description}`,
        alertId: `${(_name === "NewRandomGenerator") ? ALERTS.NewRandomGenerator : ALERTS.NewOperatorAndTreasuryAndInjectorAddresses}`,
        protocol: "PancakeSwap",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: _metadata
    })

}

export const createFunctionFinding = ( _name:string, _description:string,  _metadata:{} ) => {

    return Finding.fromObject({
        name: `Function: ${(_name === "setMinAndMaxTicketPriceInCake") ? "setMinAndMaxTicketPriceInCake" : _name }`,
        description: `PancakeSwapLottery: Function ${_description} called`,
        alertId: `${(_name === "setMinAndMaxTicketPriceInCake") ? ALERTS.setMinAndMaxTicketPriceInCake : ALERTS.setMaxNumberTicketsPerBuy}`,
        protocol: "PancakeSwap",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: _metadata
    })

}
