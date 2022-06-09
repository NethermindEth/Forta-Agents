import { Finding, HandleTransaction, TransactionEvent, FindingSeverity, FindingType } from "forta-agent";
import { CONFIG, AgentConfig } from "./agent.config";

export const provideHandleTransaction = (config: AgentConfig): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    config.monitoredAddresses.forEach((address) => {
      if (address.toLowerCase() in txEvent.addresses) {
        const amountOfInvolvedAddresses = Object.keys(txEvent.addresses).length;

        if (amountOfInvolvedAddresses >= config.threshold) {
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
                monitoredAddress: address,
                amountOfInvolvedAddresses: amountOfInvolvedAddresses.toString(),
              },
            })
          );
        }
      }
    });

    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction(CONFIG),
};
