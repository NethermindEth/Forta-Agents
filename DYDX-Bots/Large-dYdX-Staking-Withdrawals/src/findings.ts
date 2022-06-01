import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (name: string, args: any) => {
  switch (name) {
    case "Staked":
      return Finding.fromObject({
        name: "Large DYDX stake on Safety Module contract",
        description: `${name} event was emitted in Safety Module contract with a large amount`,
        alertId: "DYDX-11-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          staker: args.staker.toLowerCase(),
          spender: args.spender.toLowerCase(),
          underlyingAmount: args.underlyingAmount.toString(),
          stakeAmount: args.stakeAmount.toString(),
        },
      });

    default:
      return Finding.fromObject({
        name: "Large DYDX stake withdrawal from Safety Module contract",
        description: `${name} event was emitted in Safety Module contract with a large amount`,
        alertId: "DYDX-11-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          staker: args.staker.toLowerCase(),
          recipient: args.recipient.toLowerCase(),
          underlyingAmount: args.underlyingAmount.toString(),
          stakeAmount: args.stakeAmount.toString(),
        },
      });
  }
};
