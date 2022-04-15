import { TransactionDescription } from "ethers/lib/utils";
import { Finding, TransactionEvent, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import AddressesFetcher from "./addresses.fetcher";
import { RELY_FUNCTION_SIG } from "./utils";

export const createFinding = (metadata: { [key: string]: any } | undefined): Finding => {
  return Finding.fromObject({
    name: "Maker OSM Contract RELY Function",
    description: "RELY Function is called",
    alertId: "MakerDAO-OSM-3",
    protocol: "Maker",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata,
  });
};

export default function provideRelyFunctionHandler(fetcher: AddressesFetcher): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const contracts: string[] = Array.from(fetcher.osmContracts.values());

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
