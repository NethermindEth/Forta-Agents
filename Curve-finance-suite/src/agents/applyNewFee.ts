import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";

export const NEWFEE = "NewFee(uint256,uint256,uint256)";

export const createFinding = (alertID: string, address: string) => {
  return Finding.fromObject({
    name: "New Fee",
    description: "New Fee Function Called",
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

    if (TextEvent.filterEvent(NEWFEE, address).length > 0) {
      findings.push(createFinding(alertID, address));
    }
    return findings;
  };
};

export default provideRemovePoolAgent;
