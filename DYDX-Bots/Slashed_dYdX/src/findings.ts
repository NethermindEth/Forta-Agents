import { LogDescription, Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (log: LogDescription) => {
  return Finding.fromObject({
    name: "Slash event has occured on dYdX Safety Module.",
    description: "Slashed event was emitted",
    alertId: "DYDX-12",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "dYdX",
    metadata: {
      amount: log.args.amount.toString(),
      recipient: log.args.recipient.toLowerCase(),
      newExchangeRate: log.args.newExchangeRate.toString(),
    },
    addresses: [log.address],
  });
};
