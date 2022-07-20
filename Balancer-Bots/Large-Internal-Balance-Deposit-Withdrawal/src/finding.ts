import BigNumber from "bignumber.js";
import { Result } from "ethers/lib/utils";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (args: Result, percentage: BigNumber, symbol: string): Finding => {
  let action, alertId;

  if (args.delta.isNegative()) {
    action = "withdrawal";
    alertId = "BAL-2-1";
  } else {
    action = "deposit";
    alertId = "BAL-2-2";
  }

  return Finding.from({
    name: `Large ${symbol} internal balance ${action}`,
    description: `User's (${
      args.user
    }) internal balance of ${symbol} has changed with large ${symbol} ${action} (${percentage
      .decimalPlaces(3)
      .toString(10)}% of Vault's ${symbol} balance)`,
    alertId,
    protocol: "Balancer",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      user: args.user,
      token: args.token.toLowerCase(),
      delta: args.delta.toString(),
      percentage: percentage.toString(10),
    },
  });
};
