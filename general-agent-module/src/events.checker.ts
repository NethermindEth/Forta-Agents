import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { FindingGenerator } from "./utils";

export default function provideEventCheckerHandler(
  createFinding: FindingGenerator,
  eventSignature: string,
  address: string | undefined
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (txEvent.filterEvent(eventSignature, address).length > 0) {
      findings.push(createFinding(txEvent));
    }

    return findings;
  };
}
