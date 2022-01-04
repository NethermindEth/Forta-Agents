import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

const TREASURY_ABI = [
  "event OwnershipPushed(address indexed previousOwner, address indexed newOwner)",
  "event OwnershipPulled(address indexed previousOwner, address indexed newOwner)",
];

type FindingGenerator = (log: LogDescription) => Finding;

const pushFinding: FindingGenerator = (log: LogDescription): Finding => Finding.fromObject({
  name: "OlympusDAO Treasury Ownership event detected",
  description: "OwnershipPushed event",
  alertId: "olympus-treasury-4-1",
  severity: FindingSeverity.High,
  type: FindingType.Info,
  protocol: "OlympusDAO",
  metadata: {
    currentOwner: log.args['previousOwner'].toLowerCase(),
    proposedOwner: log.args['newOwner'].toLowerCase(),
  }
});

const pullFinding: FindingGenerator = (log: LogDescription): Finding => Finding.fromObject({
  name: "OlympusDAO Treasury Ownership event detected",
  description: "OwnershipPulled event",
  alertId: "olympus-treasury-4-2",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: "OlympusDAO",
  metadata: {
    previousOwner: log.args['previousOwner'].toLowerCase(),
    newOwner: log.args['newOwner'].toLowerCase(),
  }
});

const findingsMap: Record<string, FindingGenerator> = {
  'OwnershipPulled': pullFinding,
  'OwnershipPushed': pushFinding,
}

const createFinding: FindingGenerator = (log: LogDescription): Finding => findingsMap[log.name](log);

export default {
  TREASURY_ABI,
  createFinding,
};
