import {
  Finding,
  FindingSeverity,
  FindingType,
  Label,
  EntityType,
} from "forta-agent";

export interface Counter {
  [key: string]: number;
}

export const reentrancyLevel = (
  reentrancyCount: number,
  thresholds: [number, FindingSeverity][]
): [Boolean, FindingSeverity] => {
  let isDangerousAndSeverity: [boolean, FindingSeverity] = [
    false,
    FindingSeverity.Unknown,
  ];
  for (let i: number = 0; i < thresholds.length; i++) {
    const [threshold, severity] = thresholds[i];
    if (reentrancyCount < threshold) return isDangerousAndSeverity;
    isDangerousAndSeverity = [true, severity];
  }
  return isDangerousAndSeverity;
};

export const getConfidenceLevel = (severity: FindingSeverity): number => {
  switch (severity) {
    case FindingSeverity.Info:
      return 0.3;
    case FindingSeverity.Low:
      return 0.4;
    case FindingSeverity.Medium:
      return 0.5;
    case FindingSeverity.High:
      return 0.6;
    default:
      return 0.7;
  }
};

// Updates reentrant calls counter and returns anomaly score
export const getAnomalyScore = (
  reentrantCallsCounter: Counter,
  totalTxs: number,
  severity: FindingSeverity
): number => {
  switch (severity) {
    case FindingSeverity.Info:
      reentrantCallsCounter.Info += 1;
      return reentrantCallsCounter.Info / totalTxs;
    case FindingSeverity.Low:
      reentrantCallsCounter.Low += 1;
      return reentrantCallsCounter.Low / totalTxs;
    case FindingSeverity.Medium:
      reentrantCallsCounter.Medium += 1;
      return reentrantCallsCounter.Medium / totalTxs;
    case FindingSeverity.High:
      reentrantCallsCounter.High += 1;
      return reentrantCallsCounter.High / totalTxs;
    default:
      reentrantCallsCounter.Critical += 1;
      return reentrantCallsCounter.Critical / totalTxs;
  }
};

export const createFinding = (
  addr: string,
  reentrancyCount: number,
  severity: FindingSeverity,
  anomalyScore: number,
  confidenceLevel: number,
  txHash: string,
  txFrom: string
): Finding => {
  return Finding.fromObject({
    name: "Reentrancy calls detected",
    description: `${reentrancyCount} calls to the same contract occured`,
    alertId: "NETHFORTA-25",
    type: FindingType.Suspicious,
    severity: severity,
    metadata: {
      address: addr,
      reentrancyCount: reentrancyCount.toString(),
      anomalyScore: anomalyScore.toFixed(2),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Reentrant contract call",
        confidence: 1,
      }),
      Label.fromObject({
        entity: addr,
        entityType: EntityType.Address,
        label: "Reentrancy Victim",
        confidence: confidenceLevel,
      }),
      Label.fromObject({
        entity: txFrom,
        entityType: EntityType.Address,
        label: "Reentrancy Attacker",
        confidence: confidenceLevel,
      }),
    ],
  });
};
