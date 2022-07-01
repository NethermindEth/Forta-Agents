import { Finding, FindingType, FindingSeverity } from "forta-agent";

export const createFinding = (qiToken: string, totalSupply: string, redeemTokens: string) =>
  Finding.fromObject({
    name: "Large Pool Withdrawal",
    description: "Large pool withdrawal from a QiToken pool",
    alertId: "BENQI-5",
    severity: FindingSeverity.Medium,
    type: FindingType.Suspicious,
    protocol: "Benqi Finance",
    metadata: {
      qiToken,
      totalSupply: totalSupply,
      redeemTokens: redeemTokens,
    },
  });
