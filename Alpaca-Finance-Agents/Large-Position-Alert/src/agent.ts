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

export const POOL_ADDRESS: string = "0x00000000000000000000000"; // TODO: FIND A LEGITIMATE 'Vault' ADDRESS. CONFIRM IS IT A Vault INSTANCE WE ARE LOOKING FOR
const WBNB_THRESHOLD = new BigNumber(300000000000000000000);
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
        const filteredEvent = txEvent.filterEvent(workEventSig, POOL_ADDRESS);
        const decodedData = decodeParameters(
          ["uint256", "uint256"],
          filteredEvent[0].data // TODO: CONFIRM THERE WILL ONLY BE ONE EVENT PER TXN, SINCE HARD CODING FIRST ITEM
        );

        if(decodedData[1] > WBNB_THRESHOLD) {
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

/*
export const provideHandleTransaction = (
  alertID: string,
  address: string
): HandleTransaction => provideFunctionCallsDetectorHandler(
  createFindingGenerator(alertID),
  FD_IFACE.getFunction('claim_many').format('sighash'),
  { 
    to: address, 
    filterOnOutput: (output: string) => 
      FD_IFACE.decodeFunctionResult('claim_many', output).success,
  },
);
*/

export default {
  handleTransaction: provideHandleTransaction(
    "ALPACA-1",
    POOL_ADDRESS, // TODO: CONFIRM IT IS A POOL ADDRESS WE ARE LOOKING FOR
  )
};