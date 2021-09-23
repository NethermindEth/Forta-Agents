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

const createFindingGenerator = (alertID: string): FindingGenerator => {
  return () =>
    Finding.fromObject({
      name: 'Maker OSM Contract RELY Function Agent',
      description: 'RELY Function is called',
      alertId: alertID,
      severity: FindingSeverity.Medium,
      type: FindingType.Unknown,
    });
};
