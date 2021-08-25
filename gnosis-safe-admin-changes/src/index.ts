import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType 
} from 'forta-agent';
import { Event } from './event.data'
import { Log } from 'forta-agent/dist/sdk/receipt';
import { utils } from 'ethers';

/* Events emited for Gnosis Safe Contracts
   https://github.com/gnosis/safe-contracts/blob/main/contracts/base/OwnerManager.sol#L9-L11
   - AddedOwner(address)
   - RemovedOwner(address)
   - ChangedThreshold(uint256)
*/

const genFinding = (
  name: string, 
  description: string,
): Finding => Finding.fromObject({
  name,
  description,
  alertId: "NETHFORTA-10",
  type: FindingType.Suspicious,
  severity: FindingSeverity.High,
});

const decode = (param:string, type:string): any => 
  utils.defaultAbiCoder.decode([type], param)[0];

export const EVENTS: Event[] = [
  {
    signature: "AddedOwner(address)",
    createFinding: (addr:string): Finding => genFinding(
      "Gnosis Safe owner added",
      `New owner wallet (${decode(addr, "address")})`,
    )
  },
  {
    signature: "RemovedOwner(address)",
    createFinding: (addr:string): Finding => genFinding(
      "Gnosis Safe owner removed",
      `Removed owner wallet (${decode(addr, "address")})`,
    )
  },
  {
    signature: "ChangedThreshold(uint256)",
    createFinding: (threshold:string): Finding => genFinding(
      "Gnosis Safe threshold changed",
      `New threshold (${decode(threshold, "uint256")})`,
    )
  },
];

const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
  const findings: Finding[] = []

  if(txEvent.receipt === undefined || txEvent.receipt === null)
    return findings;

  EVENTS.forEach((e: Event) => {
    txEvent
      .filterEvent(e.signature)
      .forEach((log: Log) => {
        findings.push(
          e.createFinding(log.data)
        )
      })
  });

  return findings;
};

export default {
  handleTransaction,
};
