import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (eventName: string, tokenName: string, args: any) => {

    console.log(eventName)
    return Finding.fromObject({
      name: `Large LP Token ${(eventName === "Deposit") ? "Deposit" : "Withdrawal"}`,
      description: `${(eventName === "Deposit") ? "Deposit" : "Withdrawal"} event emitted in Masterchef contract for pool ${args.pid.toString()}, ${tokenName} token with a large amount`,
      alertId: `CAKE-${(eventName === "Deposit") ? "1" : "2"}`,
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
};
