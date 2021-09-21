import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  Log,
} from "forta-agent";
import { keccak256 } from "forta-agent/dist/sdk/utils";
import { addHexPrefix } from "ethereumjs-util";

export const COMMIT_NEW_ADMIN_SIGNATURE = "CommitNewAdmin(uint256,address)";

export const generateHash = (signature: string): string => {
  const hash = keccak256(signature);
  return "0x" + hash;
};

export const createFinding = (alertID: string, newAdmin: string) => {
  return Finding.fromObject({
    name: "Commit New Admin Event",
    description: "New Admin Committed.",
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
      const newOwner: string = addHexPrefix(log.topics[2]);
      findings.push(createFinding(alertID, newOwner));
    });

    return findings;
  };
};

export default provideCommitNewAdminEvent;
