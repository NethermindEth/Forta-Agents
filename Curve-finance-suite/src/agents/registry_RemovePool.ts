import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";

export const REMOVE_POOL_SIGNATURE = "PoolRemoved(address)";

export const createFinding = (alertID: string, address: string) => {
  return Finding.fromObject({
    name: "Remove Pool",
    description: "Pool Removed",
    alertId: alertID,
    severity: FindingSeverity.Info,
    type: FindingType.Unknown,
  });
};

const provideRemovePoolAgent = (
  alertID: string,
  address: string
): HandleTransaction => {
  return async (TextEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    if (TextEvent.addresses[address] == false) return findings;

    if (TextEvent.filterEvent(REMOVE_POOL_SIGNATURE, address).length > 0) {
      findings.push(createFinding(alertID, address));
    }
    return findings;
  };
};

export default provideRemovePoolAgent;
