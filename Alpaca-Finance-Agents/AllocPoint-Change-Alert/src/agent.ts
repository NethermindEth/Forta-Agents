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

    let timelockController: string;
    function setTimelockController(newTimelock: string) {
      timelockController = newTimelock;
    }
    function getTimelockController(): string {
      return timelockController;
    }

    let boardroomController: string;
    function setBoardroomController(newBoardroom: string) {
      boardroomController = newBoardroom;
    }
    function getBoardroomController(): string {
      return boardroomController;
    }

    for(let i = 0; i < poolControllers.length; i++) {
      if(queueTxnEvents.length > 0) {
        for(let log = 0; log < queueTxnEvents.length; log++) {
          if(pools.get(poolControllers[i]) && poolControllers[i] === queueTxnEvents[log].address) {
            setTimelockController(poolControllers[i]);
          }
        }
      } else if(mdexSetCalls.length > 0) {
        for(let log = 0; log < mdexSetCalls.length; log++) {
          if(pools.get(poolControllers[i]) && poolControllers[i] === txEvent.to) {
            setBoardroomController(poolControllers[i]);
          }
        }
      }
    }

    if(queueTxnEvents.length > 0) {
      for(let i = 0; i < queueTxnEvents.length; i++) {
        if(queueTxnEvents[i].args["signature"] === pcsSetFuncSig) {
          const decodedData = decodeParameters(
            ["uint256", "uint256", "bool"],
            queueTxnEvents[i].args["data"]
          );
          const queueTxnPools = pools.get(getTimelockController());
          if(queueTxnPools && queueTxnPools.get(Number(decodedData[0]))) {
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
    } else if(mdexSetCalls.length > 0) {
      for(let i = 0; i < mdexSetCalls.length; i++) {
        const setFuncPools = pools.get(getBoardroomController());
        
        if(setFuncPools && setFuncPools.get(Number(mdexSetCalls[i].args["_pid"]))) {
          const mdexFinding: Finding = createFinding(
            mdexSetCalls[i].args["_pid"],
            mdexSetCalls[i].args["_allocPoint"],
            mdexSetCalls[i].args["_withUpdate"],
            txEvent.to
          );
          findings.push(mdexFinding);
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