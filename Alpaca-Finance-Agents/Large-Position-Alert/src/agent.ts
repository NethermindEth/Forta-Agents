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

const POOL_ADDRESS: string = "0x00000000000000000000000"; // TODO: FIND A LEGITIMATE 'Vault' ADDRESS
export const workEventAbi: string = 'event Work(uint256,uint256)'; // TODO: CONFIRM  'id' PARAM DOESN'T NEED 'indexed'
export const VAULT_IFACE: utils.Interface = new utils.Interface([workEventAbi]); // TODO: CONFIRM THIS IS USED CORRECTLY


const createFindingGenerator = (alertId: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding => {
    const decodedData = decodeParameters(
      ["uint256", "uint256"],
      metadata?.data
    );

    return Finding.fromObject({
      name: "Large Position Event",
      description: "Large Position Has Been Taken",
      alertId: alertId,
      severity: FindingSeverity.Info,
      type: FindingType.Unknown,
      metadata:{
        positionId: decodedData[0],
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
      address,
      /*filter*/ // TODO: CONFIRM THIS SHOULD NOT BE USED
    );
    const findings: Finding[] = await handler(txEvent);

    return findings
  }
}

export default {
  handleTransaction: provideLargePositionAlert(
    "ALPACA-1",
    POOL_ADDRESS,
  )
};