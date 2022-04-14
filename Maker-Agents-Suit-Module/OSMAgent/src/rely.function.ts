import { TransactionDescription } from "ethers/lib/utils";
import { Finding, TransactionEvent, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import AddressesFetcher from "./addresses.fetcher";

export const RELY_FUNCTION_SIG = "function rely(address)";

export const createFinding = (metadata: { [key: string]: any } | undefined): Finding => {
  return Finding.fromObject({
    name: "Maker OSM Contract RELY Function",
    description: "RELY Function is called",
    alertId: "MakerDAO-OSM-3",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata,
  });
};

export default function provideRelyFunctionHandler(fetcher: AddressesFetcher): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const contracts: string[] = await fetcher.get(txEvent.timestamp);

    txEvent.filterFunction([RELY_FUNCTION_SIG], contracts).forEach((desc: TransactionDescription) => {
      const metadata = {
        contract: txEvent.to,
        reliedAddress: desc.args[0].toLowerCase(),
      };
      findings.push(createFinding(metadata));
    });

    return findings;
  };
}
