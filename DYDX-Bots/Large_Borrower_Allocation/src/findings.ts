import { LogDescription, Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (log: LogDescription) => {
  return Finding.fromObject({
    name: "Large borrower allocation change detected on dYdX perpetual exchange.",
    description: "ScheduledBorrowerAllocationChange event emitted with a large newAllocation",
    alertId: "DYDX-16",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "dYdX",
    metadata: {
      borrower: log.args.borrower.toLowerCase(),
      oldAllocation: log.args.oldAllocation.toString(),
      newAllocation: log.args.newAllocation.toString(),
      epochNumber: log.args.epochNumber.toString(),
    },
  });
};
