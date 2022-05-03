import { Finding, FindingSeverity, FindingType } from "forta-agent";

// NOTE: ADD WHICH EMITTING ADDRESS IT WAS
export const createFinding = (name: string, args: any, logAddress: string) => {
  switch (name) {
    case "BlackoutWindowChanged":
      return Finding.fromObject({
        name: "Blackout window has changed",
        description: `${name} event was emitted from the address ${logAddress}`,
        alertId: "DYDX-17-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          blackoutWindow: args.blackoutWindow.toString(),
        },
      });

    case "EpochParametersChanged":
      return Finding.fromObject({
        name: "Epoch parameters have changed",
        description: `${name} event was emitted from the address ${logAddress}`,
        alertId: "DYDX-17-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          interval: args.epochParameters[0].toString(),
          offset: args.epochParameters[1].toString(),
        },
      });

    default:
      return Finding.fromObject({
        name: "Rewards per second have been updated",
        description: `${name} event was emitted from the address ${logAddress}`,
        alertId: "DYDX-17-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          emissionPerSecond: args.emissionPerSecond.toString(),
        },
      });
  }
};
