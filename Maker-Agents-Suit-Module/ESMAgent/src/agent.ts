import provideESMJoinEventAgent from './join.event';
import provideESMFireEventAgent from './fire.event';
import { Finding, HandleTransaction, TransactionEvent } from 'forta-agent';

const MakerDAO_ESM_CONTRACT = '0x29cfbd381043d00a98fd9904a431015fef07af2f';
const JOIN_EVENT_ALERTID = 'MakerDAO-ESM-1';
const FIRE_EVENT_ALERTID = 'MakerDAO-ESM-2';

const provideAgentHandler = (): HandleTransaction => {
  const joinEventHandler = provideESMJoinEventAgent(
    JOIN_EVENT_ALERTID,
    MakerDAO_ESM_CONTRACT,
  );
  const fireEventHandler = provideESMFireEventAgent(
    FIRE_EVENT_ALERTID,
    MakerDAO_ESM_CONTRACT,
  );

  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];

    findings = [
      ...(await joinEventHandler(txEvent)),
      ...(await fireEventHandler(txEvent)),
    ];

    return findings;
  };
};

export default {
  provideAgentHandler,
  handleTransaction: provideAgentHandler(),
};
