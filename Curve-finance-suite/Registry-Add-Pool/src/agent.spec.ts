import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from 'forta-agent';

import { createAddress, TestTransactionEvent } from 'forta-agent-tools';

import { provideHandleTransaction, ADD_POOL_SIGNATURE, R_IFACE } from './agent';

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
    // Encode the pool address value
    let encodedTopicData = R_IFACE.encodeFilterTopics(
      R_IFACE.getEvent('PoolAdded'),
      ['0xab5801a7d398351b8be11c439e05c5b3259aec9b'],
    );
    const encodedPoolAddress: string = encodedTopicData[1] as string;

    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        ADD_POOL_SIGNATURE,
        // SENDERS[1] is not TARGET, so there should be no findings generated
        SENDERS[1],
	      // This string is the data (not relevant for this test so it is empty)
        '',
        encodedPoolAddress,
    );
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should detect events from the target contract', async () => {
    // Encode the pool address value
    let encodedTopicData = R_IFACE.encodeFilterTopics(
      R_IFACE.getEvent('PoolAdded'),
      ['0xab5801a7d398351b8be11c439e05c5b3259aec9b'],
    );
    const encodedPoolAddress: string = encodedTopicData[1] as string;

    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        ADD_POOL_SIGNATURE,
        TARGET,
	      // This string is the data (not relevant for this test so it is empty)
        '',
        encodedPoolAddress,
      );
    const findings = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding('0xab5801a7d398351b8be11c439e05c5b3259aec9b'),
    ]);
  });
});
