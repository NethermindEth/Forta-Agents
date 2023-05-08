import {
  Finding,
  FindingSeverity,
  FindingType,
  Label,
  EntityType,
} from "forta-agent";
import { Transfer } from "./utils";

export const createFinding = (
  txHash: string,
  from: string,
  to: string,
  funcSig: string,
  anomalyScore: number,
  severity: FindingSeverity
): Finding => {
  const [alertId, confidence, wording] =
    severity === FindingSeverity.Medium
      ? ["NIP-1", 0.9, "funds"]
      : ["NIP-2", 0.6, "transaction"];

  return Finding.fromObject({
    name: "Possible native ice phishing with social engineering component attack",
    description: `${from} sent ${wording} to ${to} with ${funcSig} as input data`,
    alertId,
    severity,
    type: FindingType.Suspicious,
    metadata: {
      attacker: to,
      victim: from,
      funcSig,
      anomalyScore: anomalyScore.toString(),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence,
        remove: false,
      }),
      Label.fromObject({
        entity: from,
        entityType: EntityType.Address,
        label: "Victim",
        confidence,
        remove: false,
      }),
      Label.fromObject({
        entity: to,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence,
        remove: false,
      }),
    ],
  });
};

export const createLowSeverityFinding = (
  txHash: string,
  from: string,
  to: string,
  funcSig: string,
  anomalyScore: number
): Finding => {
  return Finding.fromObject({
    name: "Possible native ice phishing with social engineering component attack",
    description: `${from} sent funds to ${to} with ${funcSig} as input data`,
    alertId: "NIP-3",
    severity: FindingSeverity.Low,
    type: FindingType.Suspicious,
    metadata: {
      attacker: to,
      victim: from,
      funcSig,
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
        entity: from,
        entityType: EntityType.Address,
        label: "Victim",
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
    ],
  });
};

export const createHighSeverityFinding = (
  to: string,
  anomalyScore: number,
  nativeTransfers: Transfer[]
): Finding => {
  const metadata: { [key: string]: string } = {
    attacker: to,
    anomalyScore: anomalyScore.toString(),
  };

  const labels: Label[] = [
    Label.fromObject({
      entity: to,
      entityType: EntityType.Address,
      label: "Attacker",
      confidence: 0.7,
      remove: false,
    }),
  ];

  nativeTransfers.forEach((transfer, index) => {
    const victimName = `victim${index + 1}`;
    metadata[victimName] = transfer.from;

    const victimLabel = Label.fromObject({
      entity: transfer.from,
      entityType: EntityType.Address,
      label: "Victim",
      confidence: 0.7,
      remove: false,
    });
    labels.push(victimLabel);
  });

  return Finding.fromObject({
    name: "Possible native ice phishing attack",
    description: `${to} received native tokens from 8+ different addresses`,
    alertId: "NIP-4",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata,
    labels,
  });
};

export const createCriticalSeverityFinding = (
  txHash: string,
  attacker: string,
  address: string,
  anomalyScore: number
): Finding => {
  return Finding.fromObject({
    name: "Contract deployed with characteristics indicative of a potential native ice phishing attack",
    description: `${attacker} created contract with address ${address} to be possibly used in a native ice phishing attack`,
    alertId: "NIP-5",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    metadata: {
      attacker,
      address,
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
        entity: attacker,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: 0.9,
        remove: false,
      }),
    ],
  });
};

export const createWithdrawalFinding = (
  txHash: string,
  attacker: string,
  address: string,
  anomalyScore: number
): Finding => {
  return Finding.fromObject({
    name: "Withdrawal transaction in a possible native ice phishing attack",
    description: `${attacker} called withdraw function in contract: ${address} possibly used for a native ice phishing attack`,
    alertId: "NIP-6",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    metadata: {
      attacker,
      address,
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
        entity: attacker,
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
