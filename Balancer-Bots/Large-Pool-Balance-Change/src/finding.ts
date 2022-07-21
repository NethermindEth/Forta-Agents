import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (data: any): Finding => {
  let action, alertId, text;

  if (data.delta.isNegative()) {
    action = "exit";
    alertId = "BAL-5-1";
    text = "decreased";
  } else {
    action = "join";
    alertId = "BAL-5-2";
    text = "increased";
  }

  return Finding.from({
    name: `Large pool ${action}`,
    description: `Pool's (${data.poolId}) ${data.tokenSymbol} balance has ${text} by ${data.percentage.toString(
      10
    )}% after a large ${action}`,
    alertId,
    protocol: "Balancer",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      poolId: data.poolId,
      previousBalance: data.previousBalance.toString(10),
      token: data.token.toLowerCase(),
      delta: data.delta.toString(10),
      percentage: data.percentage.toString(10),
    },
  });
};
