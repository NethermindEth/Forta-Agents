import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent';
import { 
  decodeParameter,
  decodeParameters
} from "forta-agent-tools";
import {
  MDEX_POOLS,
  PCS_POOLS
} from "./lpTokens";

const mdexSetAbi: string = "function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate)";
// TODO: FIND NEEDED ADDRESS TO FILTER MDEX'S Set FUNCTION CALL BY
const mdexAddress: string = "0x123456789";

export const pcsTimelockAddress: string = "0xA1f482Dc58145Ba2210bC21878Ca34000E2e8fE4";
const pcsQueueTxnAbi: string = "event QueueTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature, bytes data, uint eta)";
export const pcsSetFuncSig: string = "set(uint256,uint256,bool)";

const createFinding = (
  posId: number,
  allocPoint: number,
  withUpdate: boolean,
  target: string | null
  ): Finding => {
  return Finding.fromObject({
    name: "AllocPoint Change Event",
    description: "Pool's alloc point queued for update.",
    alertId: "ALPACA-6",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata:{
      positionId: posId.toString(),
      allocPoint: allocPoint.toString(),
      withUpdate: withUpdate.toString(),
      target: target || "N/A" // target ARGUMENT COULD POTENTIALLY BE undefined
    },
  })
}

export function provideHandleTransaction(addresses: Map<number, string>): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    
    /*
    const queueTxnEvents = txEvent.filterLog(pcsQueueTxnAbi);

    for(let i = 0; i < queueTxnEvents.length; i++) {
      if(queueTxnEvents[i].args["signature"] === pcsSetFuncSig) {
        const decodedData = decodeParameters(
          ["uint256", "uint256", "bool"],
          queueTxnEvents[i].args["data"]
        );
        if(addresses.get(Number(decodedData[0]))) {
          const pcsFinding: Finding = createFinding(
            decodedData[0],
            decodedData[1],
            decodedData[2],
            queueTxnEvents[i].args["target"]
          );
          findings.push(pcsFinding);
        }
      }
    }
    */

    // TODO: FIND DEPLOYED BoardRoomMDX TO FILTER BY ITS ADDRESS 
    const mdexSetCalls = txEvent.filterFunction(mdexSetAbi);

    for(let i = 0; i < mdexSetCalls.length; i++) {
      if(addresses.get(Number(mdexSetCalls[i].args["_pid"]))) {
        const mdexFinding: Finding = createFinding(
          mdexSetCalls[i].args["_pid"],
          mdexSetCalls[i].args["_allocPoint"],
          mdexSetCalls[i].args["_withUpdate"],
          txEvent.to
        );
        findings.push(mdexFinding);
      }
    }

    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction(PCS_POOLS)
}