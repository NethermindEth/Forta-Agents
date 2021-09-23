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

export const DENY_FUNCTION_SIG = 'deny(address)';

const createFindingGenerator = (alertID: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined) =>
    Finding.fromObject({
      name: 'Maker OSM DENY Function Agent',
      description: 'DENY Function is called',
      alertId: alertID,
      severity: FindingSeverity.Medium,
      type: FindingType.Unknown,
      metadata: {
        contract: metadata ? metadata.to : null,
      },
    });
};

const createAgentHandler = (
  _contract: string,
  alertID: string
): HandleTransaction => {
  return provideFunctionCallsDetectorAgent(
    createFindingGenerator(alertID),
    DENY_FUNCTION_SIG,
    { to: _contract }
  );
};

export default function provideDenyFunctionAgent(
  alertID: string,
  contracts: string[] = OSM_CONTRACTS
): HandleTransaction {
  let handlers: HandleTransaction[] = [];

  for (const contract in contracts) {
    handlers.push(createAgentHandler(contract, alertID));
  }
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    for (const handler of handlers) {
      const finding = await handler(txEvent);

      findings.push(...finding);
    }

    return findings;
  };
}
