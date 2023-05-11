import { Finding, FindingSeverity, FindingType, Label, EntityType } from "forta-agent";

export const createFinding = (
  txHash: string,
  from: string[],
  to: string,
  assets: string[],
  anomalyScore: number
): Finding => {
  const victims = from.map((victim) => {
    return Label.fromObject({
      entity: victim,
      entityType: EntityType.Address,
      label: "Victim",
      confidence: 0.6,
      remove: false,
    });
  });

  return Finding.fromObject({
    name: "Possible private key compromise",
    description: `${from.toString()} transferred funds to ${to}`,
    alertId: "PKC-1",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      attacker: to,
      victims: from.toString(),
      transferredAssets: assets
        .filter(function (item, pos) {
          return assets.indexOf(item) == pos;
        })
        .toString(),
      anomalyScore: anomalyScore.toString(),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence: 0.6,
        remove: false,
      }),
      Label.fromObject({
        entity: to,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: 0.6,
        remove: false,
      }),
      ...victims,
    ],
  });
};

export default {
  createFinding,
};
