import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from 'forta-agent';
import createFinding from "../utils/create.finding";

export const RAMPSIGNATURE = 'Ramp(uint256,uint256,uint256,uint256)';

/*
export const createFinding = (alertID: string, address: string) => {
  return Finding.fromObject({
    name: 'Ramp',
    description: 'Ramp Called',
    alertId: alertID,
    severity: FindingSeverity.Info,
    type: FindingType.Unknown,
  });
};
*/

const provideRampAgent = (
  alertID: string,
  address: string
): HandleTransaction => {
  return async (TextEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    if (TextEvent.addresses[address] == false) return findings;

    if (TextEvent.filterEvent(RAMPSIGNATURE, address).length > 0) {
      findings.push(createFinding(
        "Ramp",
        "Ramp Called",
        alertID,
        FindingSeverity.Info,
        FindingType.Unknown
      ));
    }
    return findings;
  };
};

export default provideRampAgent;
