import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';
import provideESMFireEventAgent, {
  MAKER_ESM_FIRE_EVENT_SIGNATURE,
} from './ESM_Fire_Event_Agent';
import { createTxEventWithLog } from './utils';

const ADDRESS = '0x1212';
const ALERT_ID = 'testID';

describe('ESM Fire Event Agent', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideESMFireEventAgent(ALERT_ID, ADDRESS);
  });

  it('should return a finding', async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      MAKER_ESM_FIRE_EVENT_SIGNATURE,
      ADDRESS,
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Maker ESM - Fire Event Agent',
        description: 'Fire event emitted.',
        alertId: ALERT_ID,
        severity: FindingSeverity.Medium,
        type: FindingType.Unknown,
        metadata: {
          ESM_address: ADDRESS,
        },
      }),
    ]);
  });

  it('should return empty finding cause bad ADDRESS', async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      MAKER_ESM_FIRE_EVENT_SIGNATURE,
      'ox222',
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding cause bad SIGNATURE', async () => {
    const txEvent: TransactionEvent = createTxEventWithLog('bad sig', ADDRESS);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding cause bad SIGNATURE and bad ADDRESS', async () => {
    const txEvent: TransactionEvent = createTxEventWithLog('bad sig', '0x222');

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
