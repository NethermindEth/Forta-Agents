import {
  FindingGenerator,
  provideEventCheckerHandler,
} from 'forta-agent-tools';

import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  LogDescription,
} from 'forta-agent';

export const MAKER_ESM_JOIN_EVENT_ABI = 'event Join(address indexed usr, uint256 wad)';
export const MAKER_ESM_JOIN_EVENT_SIGNATURE = 'Join(address,uint256)';
export const MKR_DECIMALS = 18;

const filterLog = (log: LogDescription, index?: number | undefined, array?: LogDescription[] | undefined): boolean => {
  const amount = log.args[1];

  return BigInt(amount) > BigInt(2 * 10 ** MKR_DECIMALS);
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
      metadata: {
        usr: metadata!.args[0],
        amount: metadata!.args[1].toString(),
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
      MAKER_ESM_JOIN_EVENT_ABI,
      _contractAddress,
      filterLog,
    );

    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
};

export default provideESMJoinEventAgent;
