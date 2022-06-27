export interface NetworkData {
  vaultAddress: string;
  threshold: string;
}

export type AgentConfig = Record<number, NetworkData>;

import { Result } from "ethers/lib/utils";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (args: Result): Finding => {
  let action, alertId;

  args.delta.isNegative()
    ? ((action = "withdrawal"), (alertId = "BAL-2-1"))
    : ((action = "deposit"), (alertId = "BAL-2-2"));

  return Finding.from({
    name: `Large internal balance ${action}`,
    description: `InternalBalanceChanged event detected with large ${action}`,
    alertId,
    protocol: "Balancer",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      user: args.user,
      token: args.token.toLowerCase(),
      delta: args.delta.toString(),
    },
  });
};
