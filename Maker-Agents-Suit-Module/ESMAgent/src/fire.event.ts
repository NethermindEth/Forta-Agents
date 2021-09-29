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
  Log,
} from 'forta-agent';

export const MAKER_ESM_FIRE_EVENT_SIGNATURE = 'Fire()';
export const MAKER_EVEREST_ID = '0xbabb5eed78212ab2db6705e6dfd53e7e5eaca437';

const createFindingGenerator = (
  alertID: string,
  ESM_address: string,
  _from: string,
): FindingGenerator => {
  return () =>
    Finding.fromObject({
      name: 'Maker ESM Fire Event',
      description: 'Fire event emitted.',
      alertId: alertID,
      severity: FindingSeverity.Critical,
      type: FindingType.Suspicious,
      protocol: 'Maker',
      everestId: MAKER_EVEREST_ID,
      metadata: {
        ESM_address: ESM_address,
        from: _from,
      },
    });
};

const provideESMFireEventAgent = (
  _alertID: string,
  _contractAddress: string,
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideEventCheckerHandler(
      createFindingGenerator(_alertID, _contractAddress, txEvent.from),
      MAKER_ESM_FIRE_EVENT_SIGNATURE,
      _contractAddress,
    );

    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
};

export default provideESMFireEventAgent;
