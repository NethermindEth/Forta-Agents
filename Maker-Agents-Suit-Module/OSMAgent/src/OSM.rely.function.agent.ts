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
import { OSM_CONTRACTS } from './utils';

export const RELY_FUNCTION_SIG = 'rely(address)';

const createFindingGenerator = (alertID: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined) =>
    Finding.fromObject({
      name: 'Maker OSM Contract RELY Function Agent',
      description: 'RELY Function is called',
      alertId: alertID,
      severity: FindingSeverity.Medium,
      type: FindingType.Unknown,
      metadata: {
        contract: metadata ? metadata.to : null,
      },
    });
};

export default function provideRelyFunctionAgent(
  alertID: string,
  contracts: string[] = OSM_CONTRACTS
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    contracts.map(async (_contract: string) => {
      const agentHandler = provideFunctionCallsDetectorAgent(
        createFindingGenerator(alertID),
        RELY_FUNCTION_SIG,
        { to: _contract }
      );

      const newFindings = await agentHandler(txEvent);
      findings.push(...newFindings);
    });

    return findings;
  };
}
