import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from 'forta-agent';

import { createAddress, TestTransactionEvent } from 'forta-agent-tools';

import { provideHandleTransaction, ADD_POOL_SIGNATURE } from './agent';

const TARGET: string = createAddress('0xdead');
const ALERT_ID: string = 'registry-add-pool-test';
const RECEIVERS: string[] = [];
const SENDERS: string[] = [];

const createFinding = ( pool: string) => Finding.fromObject({
  name: 'Curve Registry contract called',
  description: 'Event PoolAdded has been emitted',
  alertId: ALERT_ID,
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: 'Curve Finance',
  metadata: {
    pool_address: pool,
  }
});

describe('Registry-Add-Pool Agent tests suite', () => {
  const handler: HandleTransaction = provideHandleTransaction(
    ALERT_ID,
    TARGET,
  );

  beforeAll(() => {
    for(let i = 0; i <= 30; ++i) {
      RECEIVERS.push(createAddress(`0xa${i}`));
      SENDERS.push(createAddress(`0xb${i}`));
    }
  });

  it('should ignore empty transactions', async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should ignore events from other contracts', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(ADD_POOL_SIGNATURE, SENDERS[1], '', SENDERS[2], SENDERS[3]);
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should detect events from the target contract', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(ADD_POOL_SIGNATURE, TARGET, '', createAddress('0x1337'), SENDERS[2]);
    const findings = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding(createAddress('0x1337')),
    ]);
  });
});
