import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";

export const RAMPSIGNATURE = "StopRampA(uint256,uint256)";

export const createFinding = (alertID: string, address: string) => {
  return Finding.fromObject({
    name: "Stop Ramp",
    description: "Stop Ramp Called",
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

    if (TextEvent.filterEvent(RAMPSIGNATURE, address).length > 0) {
      findings.push(createFinding(alertID, address));
    }
    return findings;
  };
};

export default provideRemovePoolAgent;
