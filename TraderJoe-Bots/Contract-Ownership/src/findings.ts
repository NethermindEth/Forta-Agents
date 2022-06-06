import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (name: string, args: any, logAddress: string) => {
  return Finding.fromObject({
    name: "Ownership of a TraderJoe contract has changed",
    description: `${name} event was emitted`,
    alertId: "TRADERJOE-24",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "TraderJoe",
    metadata: {
      previousOwner: args.previousOwner.toLowerCase(),
      newOwner: args.newOwner.toLowerCase(),
    },
    addresses: [logAddress],
  });
};
