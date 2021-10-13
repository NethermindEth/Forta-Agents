import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";
import { provideFunctionCallsDetectorAgent } from "@nethermindeth/general-agents-module";
import { extractDeniedAddress } from "./utils";

export const DENY_FUNCTION_SIG = "deny(address)";

export const createFinding = (
  metadata: { [key: string]: any } | undefined
): Finding => {
  const deniedAddress: string = extractDeniedAddress(
    metadata ? metadata.input : ""
  );
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

const createAgentHandler = (_contract: string): HandleTransaction => {
  return provideFunctionCallsDetectorAgent(createFinding, DENY_FUNCTION_SIG, {
    to: _contract,
  });
};

export default function provideDenyFunctionHandler(
  contracts: string[]
): HandleTransaction {
  const handlers: HandleTransaction[] = contracts.map((contract: string) =>
    createAgentHandler(contract.toLowerCase())
  );

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    for (let handler of handlers) {
      const finding = await handler(txEvent);
      findings.push(...finding);
    }

    return findings;
  };
}
