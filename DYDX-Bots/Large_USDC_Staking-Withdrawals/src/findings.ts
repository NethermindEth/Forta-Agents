import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (name: string, args: any) => {
  switch (name) {
    case "Staked":
      return Finding.fromObject({
        name: `Large stake on Liquidity Moudle contract`,
        description: `${name} event was emitted in Liquidity Module contract with a large amount`,
        alertId: "DYDX-14-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          staker: args.staker.toLowerCase(),
          spender: args.spender.toLowerCase(),
          amount: args.amount.toString()
        },
      });

    case "WithdrewStake":
    return Finding.fromObject({
        name: "Large stake withdrawal on Liquidity Module contract", // NOTE: CONFIRM IT IS STAKE WITHDRAWAL
        description: `${name} event was emitted in Liquidity Module contract with a large amount`,
        alertId: "DYDX-14-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
            staker: args.staker.toLowerCase(),
            recipient: args.recipient.toLowerCase(),
            amount: args.amount.toString()
        },
    });

    default: // NOTE: CONFIRM IT IS NEEDED TO HAVE 'default'
    case "WithdrewDebt":
      return Finding.fromObject({
        name: "Large debt withdrawal on Liquidity Module contract", // NOTE: CONFIRM IT IS DEBT WITHDRAWAL
        description: `${name} event was emitted in Liquidity Module contract with a large amount`,
        alertId: "DYDX-14-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
            staker: args.staker.toLowerCase(),
            recipient: args.recipient.toLowerCase(),
            amount: args.amount.toString(),
            newDebtBalance: args.newDebtBalance.toString()
        },
      });
  }
};