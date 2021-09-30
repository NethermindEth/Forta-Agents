import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from "forta-agent";

import {
  provideFunctionCallsDetectorAgent,
  FindingGenerator,
} from "@nethermindeth/general-agents-module";

export const DENY_FUNCTION_SIG = "deny(address)";

const createFindingGenerator = (): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined) =>
    Finding.fromObject({
      name: "Maker OSM DENY Function Agent",
      description: "DENY Function is called",
      alertId: "MakerDAO-OSM-2",
      severity: FindingSeverity.Medium,
      type: FindingType.Unknown,
      metadata: {
        contract: metadata ? metadata.to : null,
      },
    });
};

const createAgentHandler = (_contract: string): HandleTransaction => {
  return provideFunctionCallsDetectorAgent(
    createFindingGenerator(),
    DENY_FUNCTION_SIG,
    { to: _contract }
  );
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
