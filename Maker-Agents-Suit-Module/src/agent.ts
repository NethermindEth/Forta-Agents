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

const MAKER_ESM_JOIN_EVENT_SIGNATURE = 'Join(address,uint256)';
const MKR_DECIMALS = 18;

const createFindingGenerator = (alertID: string): FindingGenerator => {
  return (metadata: { [key: string]: any } | undefined): Finding => {
    return Finding.fromObject({
      name: 'Maker ESM Contract Join Detect Agent',
      description: 'Greater than 2 MKR is sent to ESM contract.',
      alertId: alertID,
      severity: FindingSeverity.Medium,
      type: FindingType.Unknown,
      metadata,
    });
  };
};

const provideJoinEventAgent = (
  _alertID: string,
  _contractAddress: string,
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const agentHandler = provideEventCheckerHandler(
      createFindingGenerator(_alertID),
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      _contractAddress,
    );

    const findings: Finding[] = await agentHandler(txEvent);
    return findings;
  };
};

export default provideJoinEventAgent;
