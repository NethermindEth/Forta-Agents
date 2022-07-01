import { Finding, FindingType, FindingSeverity } from "forta-agent";
import { BigNumber } from "ethers";

export const createFinding = (totalBorrowerDebtBalance: BigNumber, totalActiveBalanceCurrentEpoch: BigNumber) => {
  return Finding.fromObject({
    name: "Liquidity Module Contract is insolvent",
    description: "The total borrowed balance has exceeded total active balance in the current epoch",
    alertId: "DYDX-15",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "dYdX",
    metadata: {
      totalBorrowerDebtBalance: totalBorrowerDebtBalance.toString(),
      totalActiveBalanceCurrentEpoch: totalActiveBalanceCurrentEpoch.toString(),
    },
  });
};
