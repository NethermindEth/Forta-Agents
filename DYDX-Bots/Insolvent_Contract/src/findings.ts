import { Finding, FindingType, FindingSeverity } from "forta-agent";
import { BigNumber } from "ethers";

export const createFinding = (totalBorrowerDebtBalance: BigNumber, totalActiveBalanceCurrentEpoch: BigNumber) => {
  return Finding.fromObject({
    name: "Contract Insolvent",
    description: "Total borrower debt balance has exceeded total active balance current epoch",
    alertId: "DYDX-15",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "DYDX",
    metadata: {
      totalBorrowerDebtBalance: totalBorrowerDebtBalance.toString(),
      totalActiveBalanceCurrentEpoch: totalActiveBalanceCurrentEpoch.toString(),
    },
  });
};
