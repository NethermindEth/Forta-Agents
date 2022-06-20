import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { BigNumber } from "ethers";

export const findingCase: string[] = ["lowerSupply", "upperSupply", "lowerBorrow", "upperBorrow"];

export const createFinding = (
  qiTokenAddress: string,
  interestRate: BigNumber,
  rateThreshold: BigNumber,
  findingCase: string
) => {
  switch (findingCase) {
    case "lowerSupply":
      return Finding.fromObject({
        name: "Supply rate below threshold drop",
        description: `A qiToken's supply interest rate dropped below lower threshold`,
        alertId: "BENQI-6-3",
        type: FindingType.Info,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          tokenAddress: qiTokenAddress.toLowerCase(),
          supplyInterestRate: interestRate.toString(),
          lowerRateThreshold: rateThreshold.toString(),
        },
      });
    case "upperSupply":
      return Finding.fromObject({
        name: "Supply rate upper threshold excess",
        description: `A qiToken's supply interest rate exceeded upper threshold`,
        alertId: "BENQI-6-4",
        type: FindingType.Info,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          tokenAddress: qiTokenAddress.toLowerCase(),
          supplyInterestRate: interestRate.toString(),
          upperRateThreshold: rateThreshold.toString(),
        },
      });
    case "lowerBorrow":
      return Finding.fromObject({
        name: "Βorrow rate below threshold drop",
        description: `A qiToken's borrow interest rate dropped below lower threshold`,
        alertId: "BENQI-6-1",
        type: FindingType.Info,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          tokenAddress: qiTokenAddress.toLowerCase(),
          borrowInterestRate: interestRate.toString(),
          lowerRateThreshold: rateThreshold.toString(),
        },
      });
    default:
      return Finding.fromObject({
        name: "Borrow rate upper threshold excess",
        description: `A qiToken's borrow interest rate exceeded upper threshold`,
        alertId: "BENQI-6-2",
        type: FindingType.Info,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          tokenAddress: qiTokenAddress.toLowerCase(),
          borrowInterestRate: interestRate.toString(),
          upperRateThreshold: rateThreshold.toString(),
        },
      });
  }
};
