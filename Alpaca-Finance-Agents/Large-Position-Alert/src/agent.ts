import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent'
import { BigNumber } from "ethers";

const VAULTS_THRESHOLD_MAP: Map<string, BigNumber> = new Map([
  ["0x7C9e73d4C71dae564d41F78d56439bB4ba87592f".toLowerCase(), BigNumber.from("100000000000000000000000")], // 100,000 BUSD
  ["0xbfF4a34A4644a113E8200D7F1D79b3555f723AfE".toLowerCase(), BigNumber.from("30000000000000000000")],     // 30 ETH
  ["0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7".toLowerCase(), BigNumber.from("3000000000000000000")],      // 3 BTCB
  ["0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7".toLowerCase(), BigNumber.from("100000000000000000000000")], // 100,000 USDT
  ["0xf1bE8ecC990cBcb90e166b71E368299f0116d421".toLowerCase(), BigNumber.from("200000000000000000000000")], // 200,000 ALPACA
  ["0x3282d2a151ca00BfE7ed17Aa16E42880248CD3Cd".toLowerCase(), BigNumber.from("100000000000000000000000")]  // 100,000 TUSD
])

const workEventAbi: string = "event Work(uint256 indexed id, uint256 loan)";

export const createFinding = (posId: number, loanAmount: BigNumber, vaultAddress: string): Finding => {
  return Finding.fromObject({
    name: "Large Position Event",
    description: "Large Position Has Been Taken",
    alertId: "ALPACA-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata:{
      positionId: posId.toString(),
      loanAmount: loanAmount.toString(),
      vault: vaultAddress.toString()
    },
  })
}

export function provideHandleTransaction(vaultsMap: Map<string, BigNumber>): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const workEvents = txEvent.filterLog(workEventAbi);

    for(let i = 0; i < workEvents.length; i++) {
      const vaultThreshold = vaultsMap.get(workEvents[i].address.toLowerCase());
      if (vaultThreshold && vaultThreshold.lt(workEvents[i].args["loan"])) {
        const newFinding: Finding = createFinding(
          workEvents[i].args["id"],
          workEvents[i].args["loan"],
          workEvents[i].address.toLowerCase()
        );
        findings.push(newFinding);
      }   
    }

    return findings;
  }
}

export default {
  handleTransaction: provideHandleTransaction(VAULTS_THRESHOLD_MAP)
};