import { 
  BlockEvent, 
  Finding, 
  HandleBlock, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType,
} from 'forta-agent'

const BUSD_VAULT_ADDRESS: string = "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f"; // NOTE: JUST FOR TEST, MAY FALLBACK ON USING MAP FROM PREVIOUS AGENT
// NOTE: HAD TO OMIT 'indexed' FROM BOTH 'id' AND 'killer' PARAMS TO GET filterLog() TO SUCCESSFULLY WORK.
// TODO: FIGURE OUT HOW TO KEEP IT AS IT IS.
// ORIGINAL: "event Kill(uint256 indexed id, address indexed killer, address owner, uint256 posVal, uint256 debt, uint256 prize, uint256 left)"
const killEventAbi: string = "event Kill(uint256 id, address killer, address owner, uint256 posVal, uint256 debt, uint256 prize, uint256 left)";

const createFinding = (
  posId: number,
  killer: string,
  posOwner: string,
  posVal: number,
  debt: number,
  prize: number,
  left: number,
  vaultAddress: string
): Finding => {
  return Finding.fromObject({
    name: "Liquidation Event",
    description: "Liquidation Has Occurred",
    alertId: "ALPACA-3",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata:{
      positionId: posId.toString(),
      positionkiller: killer, // TODO: CONFIRM toString() IS UNECESSARY
      positionOwner: posOwner, // TODO: CONFIRM toString() IS UNECESSARY
      positionValue: posVal.toString(),
      debt: debt.toString(),
      prize: prize.toString(),
      left: left.toString(),
      vault: vaultAddress
    },
  })
}

export function provideHandleTransaction(
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const killEvents = txEvent.filterLog(killEventAbi, address);

    for(let i = 0; i < killEvents.length; i++) {
      const newFinding: Finding = createFinding(
        killEvents[i].args["id"],
        killEvents[i].args["killer"],
        killEvents[i].args["owner"],
        killEvents[i].args["posVal"],
        killEvents[i].args["debt"],
        killEvents[i].args["prize"],
        killEvents[i].args["left"],
        killEvents[i].address
      );
      findings.push(newFinding);
    }

    return findings
  }
}

/*
export default {
  handleTransaction: provideHandleTransaction(
    BUSD_VAULT_ADDRESS
  )
};
*/