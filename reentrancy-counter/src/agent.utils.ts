import { 
  Finding, 
  FindingSeverity, 
  FindingType 
} from "forta-agent";

export interface Counter{
  [key:string]: number,
};

export const reentracyLevel = (reentracyCount: number): [Boolean, FindingSeverity] => {
  if(reentracyCount < 3)
    return [false, FindingSeverity.Unknown];

  const thresholds: [number, FindingSeverity][] = [
    [5, FindingSeverity.Info], 
    [7, FindingSeverity.Low], 
    [9, FindingSeverity.Medium], 
    [11, FindingSeverity.High],
  ];

  for(let i:number = 0; i < thresholds.length; ++i){
    const [threshold, severity] = thresholds[i];
    if(reentracyCount < threshold)
      return [true, severity];
  }
  
  return [true, FindingSeverity.Critical];
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
