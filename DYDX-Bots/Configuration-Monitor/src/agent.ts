import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";

export const MONITORED_EVENTS = [
  "event LogGlobalConfigurationRegistered(bytes32 configHash)",
  "event LogGlobalConfigurationApplied(bytes32 configHash)",
  "event LogGlobalConfigurationRemoved(bytes32 configHash)",
];
const PERPETUAL_PROXY = "0xD54f502e184B6B739d7D27a6410a67dc462D69c8";
const TEST_PROXY = "0xcd8fa8342d779f8d6acc564b73746bf9ca1261c6";

export const provideHandleTransaction = (perpetualAddress: string): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // Listen to the monitored events and generate findings for each.
    txEvent.filterLog(MONITORED_EVENTS, perpetualAddress).forEach((log) => {
      const description =
        log.name === "LogGlobalConfigurationRegistered"
          ? "registered"
          : "LogGlobalConfigurationApplied"
          ? "applied"
          : "removed";

      const alertId =
        log.name === "LogGlobalConfigurationRegistered"
          ? "DYDX-3-1"
          : "LogGlobalConfigurationApplied"
          ? "DYDX-3-2"
          : "DYDX-3-3";

      findings.push(
        Finding.fromObject({
          name: `A global configuration hash has been ${description}`,
          description: `${log.name} event emitted on perpetual contract`,
          alertId: alertId,
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          protocol: "DYDX",
          metadata: {
            configHash: log.args.configHash,
          },
        })
      );
    });

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(PERPETUAL_PROXY),
};
