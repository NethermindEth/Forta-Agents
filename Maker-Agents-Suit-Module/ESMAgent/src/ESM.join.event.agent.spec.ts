import { TestTransactionEvent } from '@nethermindeth/general-agents-module';
import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';

import provideESMJoinEventAgent, {
  MAKER_ESM_JOIN_EVENT_SIGNATURE,
  MAKER_EVEREST_ID,
} from './ESM.join.event.agent';

const ADDRESS = '0x1212';
const ALERT_ID = 'testID';
const USER = '0x22222';
const AMOUNT_3 =
  '0x00000000000000000000000000000000000000000000000029a2241af62c0000';
const AMOUNT_1 =
  '0x000000000000000000000000000000000000000000000000000000000000001';

describe('ESM Join Event Agent', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideESMJoinEventAgent(ALERT_ID, ADDRESS);
  });

  it('should returns a finding if condition meets', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      ADDRESS,
      [USER],
      AMOUNT_3, // 3
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Maker ESM Join Event',
        description: 'Greater than 2 MKR is sent to ESM contract.',
        alertId: ALERT_ID,
        protocol: 'Maker',
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        everestId: MAKER_EVEREST_ID,
        metadata: {
          usr: USER,
          amount: BigInt(AMOUNT_3).toString(),
        },
      }),
    ]);
  });

  it('should returns empty finding if MKR condition does not meet', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      ADDRESS,
      [USER],
      AMOUNT_1, //1
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should returns empty finding cause of bad SIGNATURE', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      'bad sig',
      ADDRESS,
      [USER],
      AMOUNT_3, // 3
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should returns empty finding cause of bad address', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      '0x1',
      [USER],
      AMOUNT_3, // 3
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
