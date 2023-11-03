import {
  Finding,
  FindingSeverity,
  FindingType,
  Label,
  EntityType,
  ethers,
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
  const alertId = "NIP-3";
  const uniqueKey = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(from + to + funcSig + alertId)
  );

  return Finding.fromObject({
    name: "Possible native ice phishing with social engineering component attack",
    description: `${from} sent funds to ${to} with ${funcSig} as input data`,
    alertId,
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
    uniqueKey,
  });
};

export const createHighSeverityFinding = (
  to: string,
  anomalyScore: number,
  nativeTransfers: Transfer[]
): Finding => {
  const alertId = "NIP-4";
  const now = new Date();
  const currentDate = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const uniqueKey = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(
      to + alertId + currentDate + currentMonth + currentYear
    )
  );

  const metadata: { [key: string]: string } = {
    attacker: to,
    anomalyScore: anomalyScore.toString(),
  };

  const labels: Label[] = [
    Label.fromObject({
      entity: to,
      entityType: EntityType.Address,
      label: "Attacker",
      confidence: 0.5,
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
      confidence: 0.5,
      remove: false,
    });
    labels.push(victimLabel);
  });

  return Finding.fromObject({
    name: "Possible native ice phishing attack",
    description: `${to} received native tokens from 8+ different addresses`,
    alertId,
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata,
    labels,
    uniqueKey,
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

export const createMulticallPhishingCriticalSeverityFinding = (
  txHash: string,
  attacker: string,
  address: string,
  anomalyScore: number
): Finding => {
  return Finding.fromObject({
    name: "Contract deployed with characteristics indicative of a potential erc20 & native ice phishing attack",
    description: `${attacker} created contract with address ${address} to be possibly used in an erc20 & native ice phishing attack`,
    alertId: "NIP-8",
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
  receiver: string,
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
      receiver,
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
      Label.fromObject({
        entity: receiver,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: 0.9,
        remove: false,
      }),
    ],
  });
};

export const createCriticalNIPSeverityFinding = (
  attacker: string,
  victims: string[],
  anomalyScore: number
): Finding => {
  const alertId = "NIP-7";
  const now = new Date();
  const currentDate = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const uniqueKey = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(
      attacker + alertId + currentDate + currentMonth + currentYear
    )
  );
  const metadata: { [key: string]: string } = {
    attacker,
    anomalyScore: anomalyScore.toString(),
  };

  const labels: Label[] = [
    Label.fromObject({
      entity: attacker,
      entityType: EntityType.Address,
      label: "Attacker",
      confidence: 0.8,
      remove: false,
    }),
  ];

  victims.forEach((victim, index) => {
    const victimName = `victim${index + 1}`;
    metadata[victimName] = victim;

    const victimLabel = Label.fromObject({
      entity: victim,
      entityType: EntityType.Address,
      label: "Victim",
      confidence: 0.8,
      remove: false,
    });
    labels.push(victimLabel);
  });

  return Finding.fromObject({
    name: "Native Ice Phishing Attack",
    description: `${attacker} received native tokens from 8+ different addresses, with no other interactions with the victims for a week`,
    alertId,
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    metadata,
    labels,
    uniqueKey,
  });
};

export const createMulticallPhishingFinding = (
  attackers: string[],
  victims: string[],
  anomalyScore: number
): Finding => {
  const alertId = "NIP-9";
  const now = new Date();
  const currentDate = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const attackersString = attackers.join(",");

  const uniqueKey = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(
      attackersString + alertId + currentDate + currentMonth + currentYear
    )
  );

  let labels: Label[] = [];

  const metadata: { [key: string]: string } = {
    anomalyScore: anomalyScore.toString(),
  };

  attackers.forEach((attacker, index) => {
    const attackerName = `attacker${index + 1}`;
    metadata[attackerName] = attacker;

    const attackerLabel = Label.fromObject({
      entity: attacker,
      entityType: EntityType.Address,
      label: "Attacker",
      confidence: 0.9,
      remove: false,
    });
    labels.push(attackerLabel);
  });

  victims.forEach((victim, index) => {
    const victimName = `victim${index + 1}`;
    metadata[victimName] = victim;

    const victimLabel = Label.fromObject({
      entity: victim,
      entityType: EntityType.Address,
      label: "Victim",
      confidence: 0.9,
      remove: false,
    });
    labels.push(victimLabel);
  });

  return Finding.fromObject({
    name: "Multicall ERC20 Ice Phishing Attack",
    description: `${attackers[0]} stole funds through a Multicall ERC20 Ice Phishing Attack`,
    alertId,
    severity: FindingSeverity.Info,
    type: FindingType.Suspicious,
    metadata,
    labels,
    uniqueKey,
  });
};

export const createErrorAlert = (
  errorDescription: string,
  errorSource: string,
  errorStacktrace: string
) => {
  return Finding.fromObject({
    name: "Native Ice Phishing Bot Error",
    description: `${errorDescription}`,
    alertId: "NATIVE-ICE-PHISHING-BOT-ERROR",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      errorSource,
      errorStacktrace,
    },
  });
};

export default {
  createFinding,
};
