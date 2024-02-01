import { Finding, FindingSeverity, FindingType, Label, EntityType } from "forta-agent";

export interface Counter {
  [key: string]: number;
}

export interface TraceTracker {
  [key: string]: number[][];
}

export interface FormattedTraces {
  [key: string]: string;
}

export interface RootTracker {
  [key: string]: number[];
}

// Create each path from the highest reentrancy trace addresses
export const processReentrancyTraces = (
  reentrancyTraces: number[][]
) : FormattedTraces => {
  const processedPaths: FormattedTraces = {};
  let currentPath: number[][] = [];
  let lastSharedPrefix: number[] = reentrancyTraces[0];
  let pathCount: number = 1
  for (let i = 0; i < reentrancyTraces.length; i++) {
    const currentTrace = reentrancyTraces[i];
    const sharedPrefix: boolean = lastSharedPrefix.every((traceVal: number, index: number) =>
      traceVal === currentTrace[index]
    );
    if (sharedPrefix) {
      currentPath.push(currentTrace)
      
    } else {
      processedPaths[`traceAddresses_${pathCount}`] = JSON.stringify(currentPath);
      currentPath = reentrancyTraces.filter((trace: number[], index: number) => {
        return index <= i && trace.every((traceVal: number, ind: number) => traceVal === currentTrace[ind])
      })
      pathCount += 1
    }
    lastSharedPrefix = currentTrace
  }
  if (currentPath.length > 1) {
    processedPaths[`traceAddresses_${pathCount}`] = JSON.stringify(currentPath);
  }
  return processedPaths
}

export const reentrancyLevel = (
  reentrancyCount: number,
  thresholds: [number, FindingSeverity][]
): [Boolean, FindingSeverity] => {
  let isDangerousAndSeverity: [boolean, FindingSeverity] = [false, FindingSeverity.Unknown];
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
  traceAddressPaths: FormattedTraces,
  txHash: string,
  txFrom: string
): Finding => {
  return Finding.fromObject({
    name: "Reentrancy calls detected",
    description: `${reentrancyCount} reentrant calls to the same contract occurred in ${
      Object.keys(traceAddressPaths).length
    } paths`,
    alertId: "NETHFORTA-25",
    type: FindingType.Suspicious,
    severity: severity,
    metadata: {
      address: addr,
      reentrancyCount: reentrancyCount.toString(),
      anomalyScore: anomalyScore.toFixed(2) === "0.00" ? anomalyScore.toString() : anomalyScore.toFixed(2),
      traceAddresses: JSON.stringify(traceAddressPaths),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence: confidenceLevel,
        remove: false,
      }),
      Label.fromObject({
        entity: addr,
        entityType: EntityType.Address,
        label: "Victim",
        confidence: confidenceLevel,
        remove: false,
      }),
      Label.fromObject({
        entity: txFrom,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence: confidenceLevel,
        remove: false,
      }),
    ],
  });
};
