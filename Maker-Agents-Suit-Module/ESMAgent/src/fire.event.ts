import {
  FindingGenerator,
  provideEventCheckerHandler,
} from 'forta-agent-tools';
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType
} from 'forta-agent';

export const MAKER_ESM_FIRE_EVENT_ABI = 'event Fire()';
export const MAKER_ESM_FIRE_EVENT_SIGNATURE = 'Fire()';

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
      MAKER_ESM_FIRE_EVENT_ABI,
      _contractAddress,
    );

    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
};

export default provideESMFireEventAgent;
