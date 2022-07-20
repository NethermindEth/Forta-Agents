import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (eventName: string, tokenName: string, args: any) => {
  let alertId: string;
  if (eventName === "Deposit") {
    alertId = "CAKE-4-1";
  } else if (eventName === "Withdraw") {
    alertId = "CAKE-4-2";
  } else {
    // EmergencyWithdraw
    alertId = "CAKE-4-3";
  }

  return Finding.fromObject({
    name: `Large LP Token ${eventName}`,
    description: `${eventName} event emitted in Masterchef contract for pool ${args.pid.toString()}, ${tokenName} token with a large amount`,
    alertId: alertId,
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "PancakeSwap",
    metadata: {
      user: args.user,
      token: tokenName,
      pid: args.pid.toString(),
      amount: args.amount.toString(),
    },
  });
};
