import BigNumber from "bignumber.js";
import {
  getTransactionReceipt,
  Receipt,
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import { CONFIG, AgentConfig } from "./agent.config";

export const provideHandleTransaction = (
  config: AgentConfig,
  getTransactionReceipt: (txHash: string) => Promise<Receipt>
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const involvedAddresses: string[] = [];

    const sa = await getTransactionReceipt(txEvent.hash);

    config.monitoredAddresses.forEach((address) => {
      if (address.toLowerCase() in txEvent.addresses) {
        involvedAddresses.push(address);
      }
    });

    if (involvedAddresses.length) {
      const gasUsed = new BigNumber((await getTransactionReceipt(txEvent.hash)).gasUsed);

      if (gasUsed.isLessThan(config.mediumGasThreshold)) return findings;

      findings.push(
        Finding.from({
          alertId: "UMEE-12",
          name: "High amount of gas use",
          description: "High amount of gas is used in transaction",
          type: FindingType.Suspicious,
          severity: getSeverity(gasUsed),
          protocol: "Umee",
          metadata: {
            from: txEvent.from,
            to: txEvent.to || "",
            monitoredAddresses: JSON.stringify(involvedAddresses),
            gasUsed: gasUsed.toString(10),
          },
        })
      );
    }
    return findings;
  };
};

export const getSeverity = (gasUsed: BigNumber) => {
  return gasUsed.isGreaterThan(CONFIG.criticalGasThreshold)
    ? FindingSeverity.Critical
    : gasUsed.isGreaterThan(CONFIG.highGasThreshold)
    ? FindingSeverity.High
    : FindingSeverity.Medium;
};

export default {
  handleTransaction: provideHandleTransaction(CONFIG, getTransactionReceipt),
};
