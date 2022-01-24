import BigNumber from 'bignumber.js'
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

export const BUSD_VAULT_ADDRESS: string = "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f";
const BUSD_THRESHOLD = BigInt(100000000000000000000000); // 100,000 BUSD
export const workEventAbi: string = 'event Work(uint256 indexed id, uint256 loan)';
const VAULT_IFACE: utils.Interface = new utils.Interface([workEventAbi]);
export const workEventSig: string = VAULT_IFACE.getEvent('Work').format('sighash');

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
      severity: FindingSeverity.Info, // TODO: FIND OUT WHICH Severity TO USE HERE (Info?)
      type: FindingType.Unknown,  // TODO: FIND OUT WHICH Type TO USE HERE (Unknown?)
      metadata:{
        positionId: decodedData[0],
        borrowAmount: decodedData[1]
      },
    });
  };
};

export function provideHandleTransaction(
  alertId: string,
  address: string
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const handler = provideEventCheckerHandler(
      createFindingGenerator(alertId),
      workEventSig,
      address,
      function filterLoanAmount(): boolean {
        const filteredEvent = txEvent.filterEvent(workEventSig, BUSD_VAULT_ADDRESS);
        const decodedData = decodeParameters(
          ["uint256", "uint256"],
          filteredEvent[0].data // TODO: CONFIRM THERE WILL ONLY BE ONE EVENT PER TXN, SINCE HARD CODING FIRST ITEM
        );

        if(decodedData[1] > BUSD_THRESHOLD) {
          return true;
        } else {
          return false;
        }
      }
    );
    const findings: Finding[] = await handler(txEvent);

    return findings
  }
}

export default {
  handleTransaction: provideHandleTransaction(
    "ALPACA-1",
    BUSD_VAULT_ADDRESS,
  )
};