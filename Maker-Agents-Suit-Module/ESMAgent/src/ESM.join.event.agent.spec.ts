import {
  TestTransactionEvent,
  createAddress,
} from '@nethermindeth/general-agents-module';
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
import { encodeParam } from './utils';

const ADDRESS = createAddress('0x1');
const USER = createAddress('0x2');
const ALERT_ID = 'testID';

const AMOUNT_3 = '3000000000000000000'; // 3
const AMOUNT_1 = '1000000000000000000'; // 1

describe('ESM Join Event Agent', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideESMJoinEventAgent(ALERT_ID, ADDRESS);
  });

  it('should returns a finding if condition meets', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      ADDRESS,
      [encodeParam('address', USER)],
      encodeParam('uint256', AMOUNT_3), // 3
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
          amount: AMOUNT_3,
        },
      }),
    ]);
  });

  it('should returns empty finding if MKR condition does not meet', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      ADDRESS,
      [encodeParam('address', USER)],
      encodeParam('uint256', AMOUNT_1), //1
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should returns empty finding cause of bad SIGNATURE', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      'bad sig',
      ADDRESS,
      [encodeParam('address', USER)],
      encodeParam('uint256', AMOUNT_3), // 3
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should returns empty finding cause of bad address', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      '0x1',
      [encodeParam('address', USER)],
      encodeParam('uint256', AMOUNT_1), // 3
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
