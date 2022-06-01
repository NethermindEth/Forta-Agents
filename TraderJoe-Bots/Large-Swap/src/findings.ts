import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (args: any) => {
  return Finding.fromObject({
    name: "Large Swap has occurred",
    description: "Swap event was emitted with a large amount",
    alertId: "TRADERJOE-03",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "TraderJoe",
    metadata: {
      sender: args.sender.toLowerCase(),
      amount0In: args.amount0In.toString(),
      amount1In: args.amount1In.toString(),
      amount0Out: args.amount0Out.toString(),
      amount1Out: args.amount1Out.toString(),
      to: args.to.toLowerCase(),
    },
  });
};
