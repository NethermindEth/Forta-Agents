import { Finding, FindingSeverity, FindingType } from "forta-agent";


export const createFinding = (functionABI: string): Finding => {
  return Finding.fromObject({
    name: "Staking Contract Management",
    description: "A management method from Staking contract has been called",
    alertId: "OlympusDAO-6",
    protocol: "OlympusDAO",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      functionCalled: functionABI,
    }
  })
};
