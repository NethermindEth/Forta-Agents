import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent'
import {
  decodeParameters
} from "forta-agent-tools";

const VAULT_MAP: Map<string, bigint> = new Map([
  ["0x7C9e73d4C71dae564d41F78d56439bB4ba87592f".toLowerCase(), BigInt(100000000000000000000000)], // 100,000 BUSD | NOTE: SEE L63 FOR WHY toLowerCase()
  ["0xbfF4a34A4644a113E8200D7F1D79b3555f723AfE", BigInt(30000000000000000000)],     // 30 ETH
  ["0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7", BigInt(3000000000000000000)],      // 3 BTCB
  ["0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7", BigInt(100000000000000000000000)], // 100,000 USDT
  ["0xf1bE8ecC990cBcb90e166b71E368299f0116d421", BigInt(200000000000000000000000)], // 200,000 ALPACA
  ["0x3282d2a151ca00BfE7ed17Aa16E42880248CD3Cd", BigInt(100000000000000000000000)]  // 100,000 TUSD
])

const workEventAbi: string = "event Work(uint256 id, uint256 loan)";

const createFinding = (decodedData: any, vaultAddress: string | null) => {
  return Finding.fromObject({
    name: "Large Position Event",
    description: "Large Position Has Been Taken",
    alertId: "ALPACA-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata:{
      positionId: decodedData[0],
      borrowAmount: decodedData[1],
      vault: vaultAddress?.toString() || "N/A" // TODO: CONFIRM THIS WORKS IN ALL CASES
    },
  })
}

export function provideHandleTransaction(): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const workEvents = txEvent.filterLog(workEventAbi);

    for(let i = 0; i < workEvents.length; i++) {
      // NOTE: SOMEWHERE IN THE PROCESS, IT IS TURNING THE LETTERS IN THE VAULT ADDRESS LOWER CASE. SEE L13
      const vaultThreshold = VAULT_MAP.get(workEvents[i].address);
      if (vaultThreshold) {
        const decodedData = decodeParameters(
          ["uint256", "uint256"],
          txEvent.receipt.logs[0].data // TODO: LOOK INTO HOW TO APPROACH ARRAY OF Logs
        );

        if(decodedData[1] > vaultThreshold) {
          const createdFinding: Finding = createFinding(decodedData, txEvent.to);
          findings.push(createdFinding);
        }
      }   
    }

    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction()
};