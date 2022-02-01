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
  MDEX_POOLS
} from "./lpTokens";

const mdexSetAbi: string = "function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate)";
// TODO: FIND NEEDED ADDRESS TO FILTER MDEX'S Set FUNCTION CALL BY
const mdexAddress: string = "0x123456789";

export const pcsTimelockAddress: string = "0xA1f482Dc58145Ba2210bC21878Ca34000E2e8fE4";
const pcsQueueTnxAbi: string = "event QueueTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature, bytes data, uint eta)";
export const pcsSetFuncSig: string = "set(uint256,uint256,bool)";

// TODO: FIND OUT HOW TO HANDLE FOR FOURTH ARGUMENT
const createFinding = (posId: number, allocPoint: number, withUpdate: boolean/*, targetPool: string*/): Finding => {
  return Finding.fromObject({
    name: "AllocPoint Change Event",
    description: "Pool's alloc point queued for update.",
    alertId: "ALPACA-6",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata:{
      positionId: posId.toString(),
      allocPoint: allocPoint.toString(),
      withUpdate: withUpdate.toString()//,
      //targetPool: targetPool?.toString()
    },
  })
}

/*
export function provideHandleTransaction(vaultsMap: Map<string, bigint>): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const workEvents = txEvent.filterLog(workEventAbi);

    for(let i = 0; i < workEvents.length; i++) {
      const vaultThreshold = vaultsMap.get(workEvents[i].address);
      if (vaultThreshold && BigInt(parseInt(workEvents[i].args["loan"])) > vaultThreshold) {
        const newFinding: Finding = createFinding(
          parseInt(workEvents[i].args["id"]),
          BigInt(parseInt(workEvents[i].args["loan"])),
          workEvents[i].address
        );
        findings.push(newFinding);
      }   
    }

    return findings;
  }
}
*/

export function provideHandleTransaction(): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {

    console.log("The txEvent in the anon function is: " + JSON.stringify(txEvent));

    const findings: Finding[] = []
    /*
    // NOTE: IF CAN FIND A SPECIFIC ADDRESS THAT SHOULD HAVE
    // THE FUNCTION CALL FILTERED BY, ADD IT AS THE SECOND
    // ARGUMENT TO filterFunction()
    // TODO: CONFIRM THAT THIS ONLY WORKS FOR SUCCESSFUL
    // FUNCTION CALLS.
    const mdexSetCalls = txEvent.filterFunction(mdexSetAbi);

    console.log("mdexSetCalls is: " + mdexSetCalls);

    for(let i = 0; i < mdexSetCalls.length; i++) {
      // TODO: FINDING WHAT _pid IS EXACTLY, PROBABLY
      // NOT BEST TO COMPARE TO AN ADDRESS
      if(MDEX_POOLS.get(mdexSetCalls[i].args["_pid"])) {
        const mdexFinding: Finding = createFinding(
          mdexSetCalls[i].args["_pid"],
          mdexSetCalls[i].args["_allocPoint"],
          mdexSetCalls[i].args["_withUpdate"]
        );
        findings.push(mdexFinding);
      }
    }
    */

    const pcsQueueTxnEvents = txEvent.filterLog(pcsQueueTnxAbi);

    console.log("pcsQueueTxnLogs is: " + pcsQueueTxnEvents);

    for(let i = 0; i < pcsQueueTxnEvents.length; i++) {
      const decodedFuncSig = decodeParameter("string", pcsQueueTxnEvents[i].args["signature"]);

      if(decodedFuncSig === pcsSetFuncSig) {
        const decodedData = decodeParameters(
          ["uint256", "uint256", "bool"],
          pcsQueueTxnEvents[i].args["data"]
        );

        const pcsFinding: Finding = createFinding(
          decodedData[0],
          decodedData[1],
          decodedData[3],
          // pcsQueueTxnEvents[i].args["target"]
        );
        findings.push(pcsFinding);
      }
    }

    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction()
}