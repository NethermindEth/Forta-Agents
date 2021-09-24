import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType, 
  Log,
} from 'forta-agent';
import { 
  AddressVerifier,
  isAddressKnown,
} from './utils';

const LIFT_EVENT: string = "0x3c278bd500000000000000000000000000000000000000000000000000000000";

export const createFinding = (alertId: string, unknown: string, topic: number): Finding =>
  Finding.fromObject({
    name: "MakerDAO MCDM_ADM lift event detected",
    description: `Topic #${topic} is an unknown address`,
    alertId: alertId,
    type: FindingType.Suspicious,
    severity: FindingSeverity.High,
    metadata: {
      address: unknown,
    },
  });

export const provideLiftEventsListener = (
  alertId: string, 
  contractAddress: string,
  isKnown: AddressVerifier = isAddressKnown,
  topic: string = LIFT_EVENT,
): HandleTransaction => {

  const contract: string = contractAddress.toLowerCase();

  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if(!txEvent.addresses[contract])
      return findings;

    for(const log of txEvent.logs) {
      if((log.address === contract) && (log.topics[0] === topic)){
        if(!(await isKnown(log.topics[1])))
          findings.push(createFinding(alertId, log.topics[1], 1));
        if(!(await isKnown(log.topics[2])))
          findings.push(createFinding(alertId, log.topics[2], 2));
      }
    }

    return findings;
  };
};
