import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from 'forta-agent';

import { createAddress, TestTransactionEvent, encodeParameter } from 'forta-agent-tools';

import { provideHandleTransaction, R_IFACE } from './agent';

const TARGET: string = createAddress('0xdead');
const ALERT_ID: string = 'registry-remove-pool-test';

const createFinding = ( pool: string) => Finding.fromObject({
  name: 'Pool Removed Event',
  description: 'Event PoolRemoved has been emitted',
  alertId: ALERT_ID,
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: 'Curve Finance',
  metadata: {
    pool_address: pool,
  }
});

describe('Registry-Remove-Pool Agent tests suite', () => {
  const handler: HandleTransaction = provideHandleTransaction(
    ALERT_ID,
    TARGET,
  );

  it('returns no findings on empty transactions', async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('returns no findings from events in wrong contract', async () => {
    // Encode the pool address value
    const encodedPoolAddress: string = encodeParameter('address','0xab5801a7d398351b8be11c439e05c5b3259aec9b')

    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        R_IFACE.getEvent('PoolRemoved').format('sighash'),
        // The provided value is not TARGET, so there should be no findings generated
        createAddress('0x1234'),
        // This string is the data (not relevant for this test so it is empty)
        '',
        encodedPoolAddress,
    );
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('returns no findings from irrelevant events from target contract', async () => {
    // Encode the pool address value
    const encodedPoolAddress: string = encodeParameter('address','0xab5801a7d398351b8be11c439e05c5b3259aec9b')

    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        'NotPoolRemovedEventSignature(address)',
        // The provided value is not TARGET, so there should be no findings generated
        TARGET,
        // This string is the data (not relevant for this test so it is empty)
        '',
        encodedPoolAddress,
    );
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('returns findings from contract event emission', async () => {
    // Encode the pool address value
    const encodedPoolAddress: string = encodeParameter('address','0xab5801a7d398351b8be11c439e05c5b3259aec9b')

    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        R_IFACE.getEvent('PoolRemoved').format('sighash'),
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
