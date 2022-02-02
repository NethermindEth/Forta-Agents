import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent';
import { 
  decodeParameters
} from "forta-agent-tools";
import {
  POOL_CONTROLLERS_ADDRESSES,
  MDEX_PCS_POOLS
} from "./pools";

const mdexSetAbi: string = "function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate)";

const pcsQueueTxnAbi: string = "event QueueTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature, bytes data, uint eta)";
const pcsSetFuncSig: string = "set(uint256,uint256,bool)";

let timelockController: string;
let boardroomController: string;

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
      target: target || "N/A" // target ARGUMENT COULD POTENTIALLY BE null
    },
  })
}

export function provideHandleTransaction(
  pools: Map<string, Map<number, string>>,
  poolControllers: string[]
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const queueTxnEvents = txEvent.filterLog(pcsQueueTxnAbi);
    // TODO: FIND DEPLOYED BoardRoomMDX TO FILTER BY ITS ADDRESS 
    const mdexSetCalls = txEvent.filterFunction(mdexSetAbi);

    if(queueTxnEvents.length > 0) {
      for(let event = 0; event < queueTxnEvents.length; event++) {
        for(let pc = 0; pc < poolControllers.length; pc++) {

          if(pools.get(poolControllers[pc]) && poolControllers[pc] === queueTxnEvents[event].address) {
            timelockController = poolControllers[pc];

            if(queueTxnEvents[event].args["signature"] === pcsSetFuncSig) {
              const decodedData = decodeParameters(
                ["uint256", "uint256", "bool"],
                queueTxnEvents[event].args["data"]
              );
              const queueTxnPools = pools.get(timelockController);
              if(queueTxnPools && queueTxnPools.get(Number(decodedData[0]))) {
                const pcsFinding = createFinding(
                  decodedData[0],
                  decodedData[1],
                  decodedData[2],
                  queueTxnEvents[event].args["target"]
                );
  
                findings.push(pcsFinding);
              }
            }
          }
        }
      }
    } else if(mdexSetCalls.length > 0) {
      for(let call = 0; call < mdexSetCalls.length; call++) {
        for(let pc = 0; pc < poolControllers.length; pc++) {
          if(pools.get(poolControllers[pc]) && poolControllers[pc] === txEvent.to) {
            boardroomController = poolControllers[pc];

            const setFuncPools = pools.get(boardroomController);
      
            if(setFuncPools && setFuncPools.get(Number(mdexSetCalls[call].args["_pid"]))) {
              const mdexFinding: Finding = createFinding(
                mdexSetCalls[call].args["_pid"],
                mdexSetCalls[call].args["_allocPoint"],
                mdexSetCalls[call].args["_withUpdate"],
                txEvent.to
              );
              findings.push(mdexFinding);
            }
          }
        }
      }
    }

    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction(
    MDEX_PCS_POOLS,
    POOL_CONTROLLERS_ADDRESSES
  )
}