import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';
import provideRampAgent, { RAMPSIGNATURE } from '../agents/ramp';

import createTxEventWithLog from '../utils/create.event.log';

const ADDRESS = '0X1111';
const ALERT_ID = 'NETHFORTA-21-9';

describe('Add Pool agent', () => {
  let handleTransactions: HandleTransaction;

  beforeAll(() => {
    handleTransactions = provideRampAgent(ALERT_ID, ADDRESS);
  });

  it('should create a findings', async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      RAMPSIGNATURE,
      ADDRESS
    );

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Ramp',
        description: 'Ramp Called',
        alertId: ALERT_ID,
        severity: FindingSeverity.Info,
        type: FindingType.Unknown,
      }),
    ]);
  });

  it('should return empty finding', async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      'Wrong Signature',
      '0x123'
    );

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
