import {
  Finding,
  FindingSeverity,
  FindingType,
  Label,
  EntityType,
} from "forta-agent";

export const createFinding = (
  txHash: string,
  from: string,
  to: string,
  funcSig: string,
  anomalyScore: number
): Finding => {
  return Finding.fromObject({
    name: "Possible native ice phishing with social engineering component attack",
    description: `${from} sent funds to ${to} with ${funcSig} as input data`,
    alertId: "NIP-1",
    severity: FindingSeverity.Medium,
    type: FindingType.Suspicious,
    metadata: {
      attackerAddress: to,
      victim: from,
      funcSig,
      anomalyScore: anomalyScore.toString(),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence: 0.9,
        remove: false,
      }),
      Label.fromObject({
        entity: from,
        entityType: EntityType.Address,
        label: "Victim",
        confidence: 0.9,
        remove: false,
      }),
      Label.fromObject({
        entity: to,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: 0.9,
        remove: false,
      }),
    ],
  });
};

export default {
  createFinding,
};
