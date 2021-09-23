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

export const MAKER_ESM_JOIN_EVENT_SIGNATURE = 'Join(address,uint256)';
export const MKR_DECIMALS = 18;

const filterLog = (log: Log): boolean => {
  const value = BigInt(log.data) / BigInt(10 ** MKR_DECIMALS);

  return value > 2;
};

const createFindingGenerator = (alertID: string): FindingGenerator => {
  return () =>
    Finding.fromObject({
      name: 'Maker ESM Contract Join Detect Agent',
      description: 'Greater than 2 MKR is sent to ESM contract.',
      alertId: alertID,
      severity: FindingSeverity.Medium,
      type: FindingType.Unknown,
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
