import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import { CONFIG, AgentConfig } from "./agent.config";

export const provideHandleTransaction = (config: AgentConfig): HandleTransaction => {
  const monitoredAddresses = config.monitoredAddresses.map((el) => el.toLowerCase());

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const involvedAddresses: string[] = [];
    const amountOfInvolvedAddresses: number = Object.keys(txEvent.addresses).length;

    if (amountOfInvolvedAddresses >= config.threshold) {
      monitoredAddresses.forEach((address) => {
        if (address in txEvent.addresses) {
          involvedAddresses.push(address);
        }
      });
    }

    if (involvedAddresses.length) {
      findings.push(
        Finding.from({
          alertId: "UMEE-13",
          name: "Large amount of account involvement",
          description: "Transaction includes large amount of addresses",
          type: FindingType.Info,
          severity: FindingSeverity.Info,
          protocol: "Umee",
          metadata: {
            from: txEvent.from,
            to: txEvent.to || "",
            monitoredAddresses: JSON.stringify(involvedAddresses),
            amountOfInvolvedAddresses: amountOfInvolvedAddresses.toString(),
          },
        })
      );
    }

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(CONFIG),
};
