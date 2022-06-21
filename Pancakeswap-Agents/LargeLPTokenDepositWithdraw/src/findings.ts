import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (eventName: string, tokenName: string, args: any) => {
  switch (eventName) {
    case "Deposit":
      return Finding.fromObject({
        name: "Large LP Token Deposit",
        description: `${eventName} event emitted in Masterchef contract for pool ${args.pid.toString()}, ${tokenName} token with a large amount`,
        alertId: "CAKE-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "PancakeSwap",
        metadata: {
            user: args.user,
            token: tokenName,
            pid: args.pid.toString(),
            amount: args.amount.toString()
        },
      });

    default:
      return Finding.fromObject({
        name: "Large LP Token Withdrawal",
        description: `${eventName} event emitted in Masterchef contract for pool ${args.pid.toString()}, ${tokenName} token with a large amount`,
        alertId: "CAKE-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "PancakeSwap",
        metadata: {
            user: args.user,
            token: tokenName,
            pid: args.pid.toString(),
            amount: args.amount.toString()
        },
      });
  }
};
