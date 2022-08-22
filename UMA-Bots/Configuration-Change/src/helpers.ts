import { Finding, FindingSeverity, FindingType } from "forta-agent";

export function getFindingInstance(disputerStr: string, reqTimeStr: string) {
  return Finding.fromObject({
    name: "Relayer Dispute",
    description: `The current proposed root bundle was disputed on Hubpool`,
    alertId: "UMA-3",
    severity: FindingSeverity.Medium,
    type: FindingType.Suspicious,
    protocol: "UMA",
    metadata: {
      disputer: disputerStr,
      requestTime: reqTimeStr,
    },
  });
}
