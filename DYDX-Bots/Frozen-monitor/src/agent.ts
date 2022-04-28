import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";

export const EVENTS_SIGNATURES = ["event LogFrozen()", "event LogUnFrozen()"];
export const PERPETUAL_PROXY = "0xD54f502e184B6B739d7D27a6410a67dc462D69c8";

export const provideHandleTransaction = (perpetualAddress: string): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // Listen to `LogFrozen` `LogUnFrozen` events and generate findings for each.
    txEvent.filterLog(EVENTS_SIGNATURES, perpetualAddress).forEach((log) => {
      const description = log.name === "LogFrozen" ? "Frozen" : "UnFrozen";
      const alertId = log.name === "LogFrozen" ? "dydx-2-1" : "dydx-2-2";

      findings.push(
        Finding.fromObject({
          name: `Perpetual exchange contract is ${description}`,
          description: `${log.name} event emitted on perpetual contract`,
          alertId: alertId,
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            from: txEvent.from,
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
