import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  HandleTransaction,
} from 'forta-agent';

import {
  provideFunctionCallsDetectorAgent,
  FindingGenerator,
} from '@nethermindeth/general-agents-module';

export const RELY_FUNCTION_SIG = 'rely(address)';

const createFindingGenerator = (): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined) =>
    Finding.fromObject({
      name: 'Maker OSM Contract RELY Function Agent',
      description: 'RELY Function is called',
      alertId: "MakerDAO-OSM-3",
      severity: FindingSeverity.Medium,
      type: FindingType.Unknown,
      metadata: {
        contract: metadata ? metadata.to : null,
      },
    });
};

const createAgentHandler = (
  _contract: string,
): HandleTransaction => {
  return provideFunctionCallsDetectorAgent(
    createFindingGenerator(),
    RELY_FUNCTION_SIG,
    { to: _contract }
  );
};

export default function provideRelyFunctionHandler(
  contracts: string[]
): HandleTransaction {
  const handlers: HandleTransaction[] = contracts.map((contract: string) =>
    createAgentHandler(contract.toLowerCase())
  );

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    for (let handler of handlers) {
      const finding = await handler(txEvent);
      findings.push(...finding);
    }
    return findings;
  };
}
