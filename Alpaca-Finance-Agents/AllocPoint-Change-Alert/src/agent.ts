import {
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType,
  LogDescription
} from 'forta-agent';
import { 
  decodeParameters
} from "forta-agent-tools";

const POOL_OWNERS: string[] = [
  "0xc48FE252Aa631017dF253578B1405ea399728A50", // MDEX - BscPool
  "0xA1f482Dc58145Ba2210bC21878Ca34000E2e8fE4"  // PancakeSwap - Timelock
].map(address => address.toLowerCase());

export const setFuncAbi: string = "function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate)";
export const setFuncSig: string = "set(uint256,uint256,bool)";

const queueTxnAbi: string = "event QueueTransaction(bytes32 indexed txHash, address indexed target, uint value, string signature, bytes data, uint eta)";

function isAddressRelevant(contractAddress: string, poolArray: string[]): boolean {
  return poolArray.includes(contractAddress);
}

function containsFuncSig(log: LogDescription, functionSig: string): boolean {
  return log.args["signature"] === functionSig;
}

export const createFinding = (
  poolId: number,
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
      poolId: poolId.toString(),
      allocPoint: allocPoint.toString(),
      withUpdate: withUpdate.toString(),
      target: target?.toLowerCase() || "N/A" // target ARGUMENT COULD POTENTIALLY BE null FROM txEvent.to
    },
  })
}

export function provideHandleTransaction(
  poolOwners: string[]
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    findings.push(
      ...txEvent.filterLog(queueTxnAbi)
        .filter(log => isAddressRelevant(log.address.toLowerCase(), poolOwners))
        .filter(log => containsFuncSig(log, setFuncSig))
        .map(log => {
          const decodedData = decodeParameters(
            ["uint256", "uint256", "bool"],
            log.args["data"]
          );
          return createFinding(
            decodedData[0],
            decodedData[1],
            decodedData[2],
            log.args["target"]
          );
        }),
      ...poolOwners
        .map(owner => {
          return txEvent.filterFunction(setFuncAbi, owner);
        })
        .flat()
        .map(log => {
          return createFinding(
            log.args["_pid"],
            log.args["_allocPoint"],
            log.args["_withUpdate"],
            txEvent.to
          );
        })
    );

    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction(
    POOL_OWNERS
  )
}