import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import { AddressVerifier, LiftFinding } from "./utils";
import { utils } from "ethers";

export const LIFT_EVENT: string = "0x3c278bd500000000000000000000000000000000000000000000000000000000";

const desc: {
  [key in LiftFinding]: [string, FindingSeverity];
} = {
  [LiftFinding.Lifter]: ["Lifter is an unknown address", FindingSeverity.Low],
  [LiftFinding.Spell]: ["Spell is an unknown address", FindingSeverity.High],
};

export const createFinding = (alertId: string, unknown: string, finding: LiftFinding): Finding => {
  const [_description, _severity] = desc[finding];

  return Finding.fromObject({
    name: "MakerDAO's Chief contract lift event detected",
    description: _description,
    alertId: alertId,
    type: FindingType.Info,
    severity: _severity,
    protocol: "Maker",
    metadata: {
      address: unknown,
    },
  });
};

export const provideLiftEventsListener = (
  alertId: string,
  contractAddress: string,
  isKnownSpell: AddressVerifier,
  isKnownLifter: AddressVerifier,
  topic: string = LIFT_EVENT
): HandleTransaction => {
  const contract: string = contractAddress.toLowerCase();

  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];

    if (!txEvent.addresses[contract]) return findings;

    for (const log of txEvent.logs) {
      if (log.address === contract && log.topics.length >= 3 && log.topics[0] === topic) {
        const topic1: string = utils.defaultAbiCoder.decode(["address"], log.topics[1])[0].toLowerCase();
        const topic2: string = utils.defaultAbiCoder.decode(["address"], log.topics[2])[0].toLowerCase();
        if (!isKnownLifter(topic1)) findings.push(createFinding(alertId, topic1, LiftFinding.Lifter));
        if (!isKnownSpell(topic2)) findings.push(createFinding(alertId, topic2, LiftFinding.Spell));
      }
    }

    return findings;
  };
};

export default provideLiftEventsListener;
