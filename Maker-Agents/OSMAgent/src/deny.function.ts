import { TransactionDescription } from "ethers/lib/utils";
import { Finding, TransactionEvent, FindingSeverity, FindingType, HandleTransaction } from "forta-agent";
import AddressesFetcher from "./addresses.fetcher";
import { DENY_FUNCTION_SIG } from "./utils";

export const createFinding = (metadata: { [key: string]: any } | undefined): Finding => {
  return Finding.fromObject({
    name: "Maker OSM DENY Function",
    description: "DENY Function is called",
    alertId: "MakerDAO-OSM-2",
    severity: FindingSeverity.Medium,
    protocol: "Maker",
    type: FindingType.Info,
    metadata,
  });
};

export default function provideDenyFunctionHandler(fetcher: AddressesFetcher): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const contracts: string[] = Array.from(fetcher.osmContracts.values());

    txEvent.filterFunction([DENY_FUNCTION_SIG], contracts).forEach((desc: TransactionDescription) => {
      const metadata = {
        contract: txEvent.to,
        deniedAddress: desc.args[0].toLowerCase(),
      };
      findings.push(createFinding(metadata));
    });

    return findings;
  };
}
