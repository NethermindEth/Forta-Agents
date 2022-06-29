import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (data: any): Finding => {
  let action, alertId;

  if (data.delta.isNegative()) {
    action = "exit";
    alertId = "BAL-5-1";
  } else {
    action = "join";
    alertId = "BAL-5-2";
  }

  return Finding.from({
    name: `Large pool ${action}`,
    description: `PoolBalanceChanged event detected with large ${action}`,
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
