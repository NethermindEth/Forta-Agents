import { TestTransactionEvent } from '@nethermindeth/general-agents-module';
import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';
import agent from './agent';
import {
  MAKER_ESM_FIRE_EVENT_SIGNATURE,
  MAKER_EVEREST_ID,
} from './ESM.fire.event.agent';
import { MAKER_ESM_JOIN_EVENT_SIGNATURE } from './ESM.join.event.agent';

const MakerDAO_ESM_CONTRACT = '0x29cfbd381043d00a98fd9904a431015fef07af2f';
const JOIN_EVENT_ALERTID = 'MakerDAO-ESM-1';
const FIRE_EVENT_ALERTID = 'MakerDAO-ESM-2';

const AMOUNT_3 =
  '0x00000000000000000000000000000000000000000000000029a2241af62c0000';
const AMOUNT_1 =
  '0x000000000000000000000000000000000000000000000000000000000000001';
const USER = '0x22222';

describe('Agent Handler', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.provideAgentHandler();
  });

  it('should return Fire event finding', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(MAKER_ESM_FIRE_EVENT_SIGNATURE, MakerDAO_ESM_CONTRACT)
      .setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Maker ESM Fire Event',
        description: 'Fire event emitted.',
        alertId: FIRE_EVENT_ALERTID,
        severity: FindingSeverity.Critical,
        type: FindingType.Suspicious,
        protocol: 'Maker',
        everestId: MAKER_EVEREST_ID,
        metadata: {
          ESM_address: MakerDAO_ESM_CONTRACT,
          from: USER,
        },
      }),
    ]);
  });

  it('should return Join event finding', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      MakerDAO_ESM_CONTRACT,
      [USER],
      AMOUNT_3, // 3
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Maker ESM Join Event',
        description: 'Greater than 2 MKR is sent to ESM contract.',
        alertId: JOIN_EVENT_ALERTID,
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

  it('should return both Join and Fire event finding', async () => {
    const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      MakerDAO_ESM_CONTRACT,
      [USER],
      AMOUNT_3, // 3
    );

    const txEvent2: TransactionEvent = new TestTransactionEvent()
      .addEventLog(MAKER_ESM_FIRE_EVENT_SIGNATURE, MakerDAO_ESM_CONTRACT)
      .setFrom(USER);

    const findings: Finding[] = [
      ...(await handleTransaction(txEvent1)),
      ...(await handleTransaction(txEvent2)),
    ];

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Maker ESM Join Event',
        description: 'Greater than 2 MKR is sent to ESM contract.',
        alertId: JOIN_EVENT_ALERTID,
        protocol: 'Maker',
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        everestId: MAKER_EVEREST_ID,
        metadata: {
          usr: USER,
          amount: BigInt(AMOUNT_3).toString(),
        },
      }),
      Finding.fromObject({
        name: 'Maker ESM Fire Event',
        description: 'Fire event emitted.',
        alertId: FIRE_EVENT_ALERTID,
        severity: FindingSeverity.Critical,
        type: FindingType.Suspicious,
        protocol: 'Maker',
        everestId: MAKER_EVEREST_ID,
        metadata: {
          ESM_address: MakerDAO_ESM_CONTRACT,
          from: USER,
        },
      }),
    ]);
  });

  it('should return just Join event finding', async () => {
    const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      MakerDAO_ESM_CONTRACT,
      [USER],
      AMOUNT_3, // 3
    );

    const txEvent2: TransactionEvent = new TestTransactionEvent()
      .addEventLog('BAD SIGNATURE', MakerDAO_ESM_CONTRACT)
      .setFrom(USER);

    const findings: Finding[] = [
      ...(await handleTransaction(txEvent1)),
      ...(await handleTransaction(txEvent2)),
    ];

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Maker ESM Join Event',
        description: 'Greater than 2 MKR is sent to ESM contract.',
        alertId: JOIN_EVENT_ALERTID,
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

  it('should return just Fire event finding', async () => {
    const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      MakerDAO_ESM_CONTRACT,
      [USER],
      AMOUNT_1, // 1
    );

    const txEvent2: TransactionEvent = new TestTransactionEvent()
      .addEventLog(MAKER_ESM_FIRE_EVENT_SIGNATURE, MakerDAO_ESM_CONTRACT)
      .setFrom(USER);

    const findings: Finding[] = [
      ...(await handleTransaction(txEvent1)),
      ...(await handleTransaction(txEvent2)),
    ];

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Maker ESM Fire Event',
        description: 'Fire event emitted.',
        alertId: FIRE_EVENT_ALERTID,
        severity: FindingSeverity.Critical,
        type: FindingType.Suspicious,
        protocol: 'Maker',
        everestId: MAKER_EVEREST_ID,
        metadata: {
          ESM_address: MakerDAO_ESM_CONTRACT,
          from: USER,
        },
      }),
    ]);
  });
  it('should return empty finding if address is wrong', async () => {
    const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      '0x1', // bad address
      [USER],
      AMOUNT_3, // 1
    );

    const txEvent2: TransactionEvent = new TestTransactionEvent()
      .addEventLog(MAKER_ESM_FIRE_EVENT_SIGNATURE, '0x1')
      .setFrom(USER);

    const findings: Finding[] = [
      ...(await handleTransaction(txEvent1)),
      ...(await handleTransaction(txEvent2)),
    ];

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding if signature is wrong', async () => {
    const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
      '0xabc', // bad signature
      MakerDAO_ESM_CONTRACT,
      [USER],
      AMOUNT_3, // 1
    );

    const txEvent2: TransactionEvent = new TestTransactionEvent()
      .addEventLog('0xabc', MakerDAO_ESM_CONTRACT)
      .setFrom(USER);

    const findings: Finding[] = [
      ...(await handleTransaction(txEvent1)),
      ...(await handleTransaction(txEvent2)),
    ];

    expect(findings).toStrictEqual([]);
  });
});
