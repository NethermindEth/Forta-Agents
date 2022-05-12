import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (args: any, module: string) => {
  return Finding.fromObject({
    name: `Large spending approval detected on ${module}`,
    description: `Approval event was emitted with a large value`,
    alertId: module === "Liquidity Module" ? "DYDX-19-1" : "DYDX-19-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "dYdX",
    metadata: {
      value: args.value.toString(),
      owner: args.owner.toLowerCase(),
      spender: args.spender.toString(),
    },
  });
};
