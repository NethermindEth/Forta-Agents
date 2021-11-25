import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  Log,
} from 'forta-agent';
import { keccak256 } from 'forta-agent/dist/sdk/utils';
import { addHexPrefix } from 'ethereumjs-util';
import { decodeParameter } from 'nethermindeth-general-agents-module';

export const COMMIT_NEW_ADMIN_SIGNATURE = 'CommitNewAdmin(uint256,address)';


export const createFinding = (alertID: string, newAdmin: string) => {
  return Finding.fromObject({
    name: 'Curve Admin Event Detected',
    description: 'New Admin Committed.',
    alertId: alertID,
    severity: FindingSeverity.Medium,
    type: FindingType.Unknown,
    metadata: {
      newAdmin: newAdmin,
    },
  });
};

const provideCommitNewAdminEvent = (
  alertID: string,
  address: string
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    if (txEvent.addresses[address] == false) return findings;

    txEvent.filterEvent(COMMIT_NEW_ADMIN_SIGNATURE, address).map((log: Log) => {
      const decoded_Address = decodeParameter('address', log.topics[2]);

      const newOwner: string = addHexPrefix(decoded_Address);
      findings.push(createFinding(alertID, newOwner.toLowerCase()));
    });

    return findings;
  };
};

export default provideCommitNewAdminEvent;
