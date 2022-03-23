import { Finding, FindingSeverity, FindingType } from "forta-agent";
import { BigNumber, FixedNumber } from "ethers";

export const findingCase: string[] = ["lowerSupply", "upperSupply", "lowerBorrow", "upperBorrow"];

export const createFinding = (
  qiTokenName: string,
  qiTokenAddress: string,
  interestRate: BigNumber,
  rateThreshold: BigNumber,
  findingCase: string
) => {
  switch (findingCase) {
    case "lowerSupply":
      return Finding.fromObject({
        name: "Supply rate below threshold drop",
        description: `${qiTokenName} token's supply interest rate dropped below lower threshold`,
        alertId: "BENQI-6-3",
        type: FindingType.Suspicious,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          token: qiTokenName,
          tokenAddress: qiTokenAddress.toLowerCase(),
          supplyInterestRate: interestRate.toString(),
          lowerRateThreshold: rateThreshold.toString(),
          thresholdExceededBy: `${FixedNumber.from(interestRate)
            .subUnsafe(FixedNumber.from(rateThreshold))
            .mulUnsafe(FixedNumber.from(100))
            .divUnsafe(FixedNumber.from(rateThreshold))
            .toString()
            .slice(0, 5)}%`,
        },
      });
    case "upperSupply":
      return Finding.fromObject({
        name: "Supply rate upper threshold excess",
        description: `${qiTokenName} token's supply interest rate exceeded upper threshold`,
        alertId: "BENQI-6-4",
        type: FindingType.Suspicious,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          token: qiTokenName,
          tokenAddress: qiTokenAddress.toLowerCase(),
          supplyInterestRate: interestRate.toString(),
          upperRateThreshold: rateThreshold.toString(),
          thresholdExceededBy: `${FixedNumber.from(interestRate)
            .subUnsafe(FixedNumber.from(rateThreshold))
            .mulUnsafe(FixedNumber.from(100))
            .divUnsafe(FixedNumber.from(rateThreshold))
            .toString()
            .slice(0, 5)}%`,
        },
      });
    case "lowerBorrow":
      return Finding.fromObject({
        name: "Βorrow rate below threshold drop",
        description: `${qiTokenName} token's borrow interest rate dropped below lower threshold`,
        alertId: "BENQI-6-1",
        type: FindingType.Suspicious,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          token: qiTokenName,
          tokenAddress: qiTokenAddress.toLowerCase(),
          borrowInterestRate: interestRate.toString(),
          lowerRateThreshold: rateThreshold.toString(),
          thresholdExceededBy: `${FixedNumber.from(interestRate)
            .subUnsafe(FixedNumber.from(rateThreshold))
            .mulUnsafe(FixedNumber.from(100))
            .divUnsafe(FixedNumber.from(rateThreshold))
            .toString()
            .slice(0, 5)}%`,
        },
      });
    default:
      return Finding.fromObject({
        name: "Borrow rate upper threshold excess",
        description: `${qiTokenName} token's borrow interest rate exceeded upper threshold`,
        alertId: "BENQI-6-2",
        type: FindingType.Suspicious,
        severity: FindingSeverity.Medium,
        protocol: "Benqi Finance",
        metadata: {
          token: qiTokenName,
          tokenAddress: qiTokenAddress.toLowerCase(),
          borrowInterestRate: interestRate.toString(),
          upperRateThreshold: rateThreshold.toString(),
          thresholdExceededBy: `${FixedNumber.from(interestRate)
            .subUnsafe(FixedNumber.from(rateThreshold))
            .mulUnsafe(FixedNumber.from(100))
            .divUnsafe(FixedNumber.from(rateThreshold))
            .toString()
            .slice(0, 5)}%`,
        },
      });
  }
};
