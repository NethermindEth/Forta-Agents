import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";
import createFinding from "../utils/create.finding";

// Event signature found in Registry.vy in Curve repo
export const ADD_POOL_SIGNATURE = "PoolAdded(address,bytes)";

/*
export const createFinding = (alertID: string) => {
  return Finding.fromObject({
    name: "Add Pool",
    description: "New Pool Added",
    alertId: alertID,
    severity: FindingSeverity.Info,
    type: FindingType.Unknown,
  });
};
*/

const provideAddPoolAgent = (
  alertID: string,
  address: string
): HandleTransaction => {
  return async (TextEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    if (TextEvent.addresses[address] == false) return findings;

    if (TextEvent.filterEvent(ADD_POOL_SIGNATURE, address).length > 0) {
      findings.push(createFinding(
        "Add Pool",
        "New Pool Added",
        alertID,
        FindingSeverity.Info,
        FindingType.Unknown
      ));
    }
    return findings;
  };
};

export default provideAddPoolAgent;
