import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";

import createFinding from "../utils/create.finding";

// Event signature found in Registry.vy in Curve repo
export const REMOVE_POOL_SIGNATURE = "PoolRemoved(address)";

export default function provideRemovePoolAgent(
  alertID: string,
  address: string
): HandleTransaction {
  return async (TextEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // If the relevant address is not involved then exit
    if (TextEvent.addresses[address] == false) return findings;

    // If an event with the signature of `ADD_POOL_SIGNATURE` is within the TX
    if (TextEvent.filterEvent(REMOVE_POOL_SIGNATURE, address).length > 0) {
      // Create a finding
      findings.push(createFinding(
        "Remove Pool",
        "Pool Removed",
        alertID,
        FindingSeverity.Info,
        FindingType.Unknown
      ));
    }

    // Return any findings
    return findings;
  };
};
