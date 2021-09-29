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
import { decodeParam } from './utils';

export const MAKER_ESM_JOIN_EVENT_SIGNATURE = 'Join(address,uint256)';
export const MKR_DECIMALS = 18;
export const MAKER_EVEREST_ID = '0xbabb5eed78212ab2db6705e6dfd53e7e5eaca437';

const filterLog = (log: Log): boolean => {
  const amount = decodeParam('uint256', log.data);
  return amount > 2;
};

const createFindingGenerator = (_alertID: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding =>
    Finding.fromObject({
      name: 'Maker ESM Join Event',
      description: 'Greater than 2 MKR is sent to ESM contract.',
      alertId: _alertID,
      protocol: 'Maker',
      severity: FindingSeverity.Medium,
      type: FindingType.Suspicious,
      everestId: MAKER_EVEREST_ID,
      metadata: {
        usr: decodeParam('address', metadata!.topics[1]).toLowerCase(),
        amount: decodeParam('uint256', metadata!.data),
      },
    });
};

const provideESMJoinEventAgent = (
  _alertID: string,
  _contractAddress: string,
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideEventCheckerHandler(
      createFindingGenerator(_alertID),
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      _contractAddress,
      filterLog,
    );

    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
};

export default provideESMJoinEventAgent;
