import {
  ethers,
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
  const monitoredAddresses = config.monitoredAddresses.map((el) => el.toLowerCase());

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const involvedAddresses: string[] = [];

    monitoredAddresses.forEach((address) => {
      if (address in txEvent.addresses) {
        involvedAddresses.push(address);
      }
    });

    if (involvedAddresses.length) {
      const gasUsed = ethers.BigNumber.from((await getTransactionReceipt(txEvent.hash)).gasUsed);

      if (gasUsed.lt(config.mediumGasThreshold)) return findings;

      findings.push(
        Finding.from({
          alertId: "UMEE-12",
          name: "High amount of gas use",
          description: "High amount of gas is used in transaction",
          type: FindingType.Suspicious,
          severity: getSeverity(gasUsed, config),
          protocol: "Umee",
          metadata: {
            from: txEvent.from,
            to: txEvent.to || "",
            gasUsed: gasUsed.toString(),
          },
          addresses: involvedAddresses,
        })
      );
    }
    return findings;
  };
};

export const getSeverity = (gasUsed: ethers.BigNumber, config: AgentConfig) => {
  if (gasUsed.gte(config.criticalGasThreshold)) {
    return FindingSeverity.Critical;
  } else if (gasUsed.gte(config.highGasThreshold)) {
    return FindingSeverity.High;
  } else {
    return FindingSeverity.Medium;
  }
};

export default {
  handleTransaction: provideHandleTransaction(CONFIG, getTransactionReceipt),
};
