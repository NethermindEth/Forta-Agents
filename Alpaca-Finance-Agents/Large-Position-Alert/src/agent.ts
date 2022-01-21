import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent'
import {
  provideEventCheckerHandler,
  FindingGenerator,
  decodeParameters
} from "forta-agent-tools";
import { utils } from 'ethers';

const POOL_ADDRESS: string = "0x00000000000000000000000"; // TODO: FIND A LEGITIMATE 'Vault' ADDRESS. CONFIRM IS IT A Vault INSTANCE WE ARE LOOKING FOR
export const workEventAbi: string = 'event Work(uint256 indexed id, uint256 loan)';
export const VAULT_IFACE: utils.Interface = new utils.Interface([workEventAbi]); // TODO: CONFIRM THIS IS USED CORRECTLY.


const createFindingGenerator = (alertId: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding => {
    const decodedData = decodeParameters(
      ["uint256", "uint256"],
      metadata?.data // TODO: CONFIRM IT IS THE data KEY WE ARE LOOKING FOR. REFERENCE Forta-Agent-Tools DOCS
    );

    return Finding.fromObject({
      name: "Large Position Event",
      description: "Large Position Has Been Taken",
      alertId: alertId,
      severity: FindingSeverity.Info, // TODO: FIND OUT WHICH Severity TO USE HERE (Info?)
      type: FindingType.Unknown,  // TODO: FIND OUT WHICH Type TO USE HERE (Info?)
      metadata:{
        positionId: decodedData[0], // TODO: CONFIRM THE TO INDEX ITEMS ARE WHAT IS ASSUMED (L34 & L35)
        borrowAmount: decodedData[1]
      },
    });
  };
};

export function provideLargePositionAlert(
  alertId: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const handler = provideEventCheckerHandler(
      createFindingGenerator(alertId),
      VAULT_IFACE.getEvent('Work').format('sighash'),
      address // NOTE: Forta-Agent-Tools MENTIONS THE THIRD OPTIONAL ARGUMENT SHOULD BE AN OBJECT. MAYBE REPO README OUT OF DATE?
    );
    const findings: Finding[] = await handler(txEvent);

    return findings
  }
}

export default {
  handleTransaction: provideLargePositionAlert(
    "ALPACA-1",
    POOL_ADDRESS, // TODO: CONFIRM IT IS A POOL ADDRESS WE ARE LOOKING FOR
  )
};