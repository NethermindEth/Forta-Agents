import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";

export const ADD_POOL_SIGNATURE = "PoolAdded(address,bytes)";

export const createFinding = (alertID: string, address: string) => {
  return Finding.fromObject({
    name: "Add Pool",
    description: "New Pool Added",
    alertId: alertID,
    severity: FindingSeverity.Info,
    type: FindingType.Unknown,
  });
};

const provideAddPoolAgent = (
  alertID: string,
  address: string
): HandleTransaction => {
  return async (TextEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    if (TextEvent.addresses[address] == false) return findings;

    if (TextEvent.filterEvent(ADD_POOL_SIGNATURE, address).length > 0) {
      findings.push(createFinding(alertID, address));
    }
    return findings;
  };
};

export default provideAddPoolAgent;
