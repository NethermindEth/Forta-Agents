import { Finding, HandleTransaction, Log, TransactionEvent } from "forta-agent";
import { FindingGenerator } from "./utils";

export default function provideEventCheckerHandler(
  createFinding: FindingGenerator,
  eventSignature: string,
  address?: string,
  filter?: (log: Log, index?: number, array?: Log[]) => boolean
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (txEvent.filterEvent(eventSignature, address).length > 0) {
      if (filter) {
        txEvent
          .filterEvent(eventSignature, address)
          .filter(filter)
          .map(() => findings.push(createFinding()));
      } else {
        findings.push(createFinding());
      }
    }

    return findings;
  };
}
