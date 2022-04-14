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
  LiftFinding,
} from './utils';

export const LIFT_EVENT: string = "0x3c278bd500000000000000000000000000000000000000000000000000000000";
export const KNOWN_LIFTERS: string[] = [
  "0x5cab1e5286529370880776461c53a0e47d74fb63",
];

const desc: {
  [key in LiftFinding]: string;
} = {
  [LiftFinding.Lifter]: "Lifter is an unknown address",
  [LiftFinding.Spell]: "Spell is an unknown address",
};

export const createFinding = (alertId: string, unknown: string, finding: LiftFinding): Finding =>
  Finding.fromObject({
    name: "MakerDAO's Chief contract lift event detected",
    description: desc[finding],
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
      if(
        (log.address === contract) && 
        (log.topics.length >= 3) &&
        (log.topics[0] === topic) 
      ){
        const topic1: string = decodeSingleParam('address', log.topics[1]).toLowerCase();
        const topic2: string = decodeSingleParam('address', log.topics[2]).toLowerCase();
        if(!isKnown(topic1))
          findings.push(createFinding(alertId, topic1, LiftFinding.Lifter));
        if(!isKnown(topic2))
          findings.push(createFinding(alertId, topic2, LiftFinding.Spell));
      }
    }

    return findings;
  };
};

export default provideLiftEventsListener;
