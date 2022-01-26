import BigNumber from 'bignumber.js'
import { 
  BlockEvent, 
  Finding, 
  HandleBlock, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType,
} from 'forta-agent'

const BUSD_VAULT_ADDRESS: string = "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f";
const killEventAbi: string = "event Kill(uint256 indexed id, address indexed killer, address owner, uint256 posVal, uint256 debt, uint256 prize, uint256 left)";

export function provideHandleTransaction(
  alertId: string//,
  /*addresses: string[],*/
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const killEmissions = txEvent.filterLog(killEventAbi, BUSD_VAULT_ADDRESS);

    console.log("The kill emissions found in the txEvent are: " + killEmissions);

    const findings: Finding[] = [];

    return findings
  }
}

export default {
  handleTransaction: provideHandleTransaction(
    "ALPACA-3"//,
    /*VAULT_ADDRESSES*/
  )
};