import { 
  Finding, 
  FindingSeverity, 
  FindingType 
} from "forta-agent";

export interface Counter{
  [key:string]: number,
};

export const reentracyLevel = (reentracyCount: number, thresholds: [number, FindingSeverity][]): [Boolean, FindingSeverity] => {
  const isDangerousAndSeverity: [boolean, FindingSeverity] = [false, FindingSEverity.Unknown]
  for(let i:number = 0; i < thresholds.length; i++){
    const [threshold, severity] = thresholds[i];
    if(reentracyCount < threshold) {
       break;
    }
    isDangerousAndSeverity = [threshold, severity];
  }
 return isDangerousAndSeverity;
};

export const createFinding = (
  addr: string, 
  reentracyCount: number, 
  severity: FindingSeverity
): Finding => {
  return Finding.fromObject({
    name: "Reentrancy calls detected",
    description: `${reentracyCount} calls to the same contract ocur`,
    alertId: "NETHFORTA-25",
    type: FindingType.Suspicious,
    severity: severity,
    metadata:{
      address: addr,
      reentracyCount: reentracyCount.toString(),
    }
  });
};
