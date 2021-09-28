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
  decodeSingleParam,
} from './utils';

const LIFT_EVENT: string = "0x3c278bd500000000000000000000000000000000000000000000000000000000";

export const createFinding = (alertId: string, unknown: string, topic: number): Finding =>
  Finding.fromObject({
    name: "MakerDAO's Chief contract lift event detected",
    description: `Topic #${topic} is an unknown address`,
    alertId: alertId,
    type: FindingType.Suspicious,
    severity: FindingSeverity.High,
    protocol: "Maker",
    everestId: "0xbabb5eed78212ab2db6705e6dfd53e7e5eaca437",
    metadata: {
      address: unknown,
    },
  });

export const provideLiftEventsListener = (
  alertId: string, 
  contractAddress: string,
  isKnown: AddressVerifier,
  topic: string = LIFT_EVENT,
): HandleTransaction => {

  const contract: string = contractAddress.toLowerCase();

  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if(!txEvent.addresses[contract])
      return findings;

    for(const log of txEvent.logs) {
      if((log.address === contract) && (log.topics[0] === topic)){
        const topic1: string = decodeSingleParam('address', log.topics[1]).toLowerCase();
        const topic2: string = decodeSingleParam('address', log.topics[2]).toLowerCase();
        if(!(await isKnown(topic1)))
          findings.push(createFinding(alertId, topic1, 1));
        if(!(await isKnown(topic2)))
          findings.push(createFinding(alertId, topic2, 2));
      }
    }

    return findings;
  };
};

export default provideLiftEventsListener;
