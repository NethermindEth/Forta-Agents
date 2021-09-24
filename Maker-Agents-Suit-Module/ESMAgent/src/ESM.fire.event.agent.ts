import {
  FindingGenerator,
  provideEventCheckerHandler,
} from '@nethermindeth/general-agents-module';
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from 'forta-agent';

export const MAKER_ESM_FIRE_EVENT_SIGNATURE = 'Fire()';

const createFindingGenerator = (
  alertID: string,
  ESM_address: string,
): FindingGenerator => {
  return () =>
    Finding.fromObject({
      name: 'Maker ESM - Fire Event Agent',
      description: 'Fire event emitted.',
      alertId: alertID,
      severity: FindingSeverity.Medium,
      type: FindingType.Unknown,
      metadata: {
        ESM_address: ESM_address,
      },
    });
};

const provideESMFireEventAgent = (
  _alertID: string,
  _contractAddress: string,
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideEventCheckerHandler(
      createFindingGenerator(_alertID, _contractAddress),
      MAKER_ESM_FIRE_EVENT_SIGNATURE,
      _contractAddress,
    );

    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
};

export default provideESMFireEventAgent;
