import {
  FindingGenerator,
  provideEventCheckerHandler,
} from '@nethermindeth/general-agents-module';
import Web3 from 'web3';
import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  Log,
} from 'forta-agent';

export const MAKER_ESM_JOIN_EVENT_SIGNATURE = 'Join(address,uint256)';
export const MKR_DECIMALS = 18;
export const MAKER_EVEREST_ID = '0xbabb5eed78212ab2db6705e6dfd53e7e5eaca437';

const filterLog = (log: Log): boolean => {
  const value = BigInt(log.data) / BigInt(10 ** MKR_DECIMALS);

  return value > 2;
};

const createFindingGenerator = (
  _alertID: string,
  _usr: string,
  _amount: string,
): FindingGenerator => {
  return () =>
    Finding.fromObject({
      name: 'Maker ESM Join Event',
      description: 'Greater than 2 MKR is sent to ESM contract.',
      alertId: _alertID,
      protocol: 'Maker',
      severity: FindingSeverity.Medium,
      type: FindingType.Suspicious,
      everestId: MAKER_EVEREST_ID,
      metadata: {
        usr: _usr,
        amount: _amount,
      },
    });
};

const provideESMJoinEventAgent = (
  _alertID: string,
  _contractAddress: string,
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findingGenerator: FindingGenerator;

    const logs = txEvent.filterEvent(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      _contractAddress,
    );

    if (logs.length) {
      findingGenerator = createFindingGenerator(
        _alertID,
        logs[0].topics[1],
        BigInt(logs[0].data).toString(),
      );
    } else {
      findingGenerator = createFindingGenerator(_alertID, '', '');
    }

    const agentHandler = provideEventCheckerHandler(
      findingGenerator,
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      _contractAddress,
      filterLog,
    );

    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
};

export default provideESMJoinEventAgent;
