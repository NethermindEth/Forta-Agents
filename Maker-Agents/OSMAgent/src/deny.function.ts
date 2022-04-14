import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";
import { provideFunctionCallsDetectorHandler } from "forta-agent-tools";
import AddressesFetcher from "./addresses.fetcher";

export const DENY_FUNCTION_SIG = "deny(address)";

export const createFinding = (
  metadata: { [key: string]: any } | undefined
): Finding => {
  const deniedAddress: string = metadata?.arguments[0];

  return Finding.fromObject({
    name: "Maker OSM DENY Function",
    description: "DENY Function is called",
    alertId: "MakerDAO-OSM-2",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    everestId: "0xbabb5eed78212ab2db6705e6dfd53e7e5eaca437",
    metadata: {
      contract: metadata ? metadata.to : null,
      deniedAddress: deniedAddress,
    },
  });
};

const createAgentHandler = (_contract: string): HandleTransaction =>
  provideFunctionCallsDetectorHandler(createFinding, DENY_FUNCTION_SIG, {
    to: _contract,
  });

export default function provideDenyFunctionHandler(
  fetcher: AddressesFetcher,
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const contracts: string[] = await fetcher.get(txEvent.timestamp);

    const promises: Promise<Finding[]>[] = contracts.map((contract: string) =>
      createAgentHandler(contract.toLowerCase())(txEvent)
    );

    return Promise.all(promises).then((result: Finding[][]) => result.flat());
  };
};
