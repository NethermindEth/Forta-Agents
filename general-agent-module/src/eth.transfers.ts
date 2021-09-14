import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { FindingGenerator } from "./utils";

type agentOptions = {
  from?: string;
  to?: string;
  valueThreshold?: string;
};

type ethTransferInfo = {
  from: string;
  to: string;
  value: string;
};

export default function provideETHTransferAgent(
  findingGenerator: FindingGenerator,
  agentOptions?: agentOptions
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (agentOptions?.from !== undefined && agentOptions?.from !== txEvent.from) {
      return findings;
    }

    if (agentOptions?.to !== undefined && agentOptions?.to !== txEvent.to) {
      return findings;
    }

    if (agentOptions?.valueThreshold !== undefined && agentOptions?.valueThreshold !== txEvent.transaction.value) {
      return findings;
    }

    findings.push(findingGenerator({ from: txEvent.from, to: txEvent.to, value: txEvent.transaction.value }));
    return findings;
  };
}
