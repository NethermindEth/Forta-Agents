import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from 'forta-agent';

import { createAddress, TestTransactionEvent } from 'forta-agent-tools';

import { provideHandleTransaction, POOL_PROXY_IFACE } from './agent';

const TARGET: string = createAddress('0xdead');
const ALERT_ID: string = 'newfee-test';
const SENDERS: string[] = [];

const createFinding = (pool: string) => Finding.fromObject({
  name: 'CurveDAO Pool Owner contract called',
  description: 'Function NewFee executed',
  alertId: ALERT_ID,
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: 'Curve Finance',
  metadata: {
    affected_pool: pool, 
  },
});

describe('NewFee Agent tests suite', () => {
  const handler: HandleTransaction = provideHandleTransaction(
    ALERT_ID,
    TARGET,
  );

  beforeAll(() => {
    for(let i = 0; i <= 30; ++i)
      SENDERS.push(createAddress(`0xb${i}`));
  });

  it('should ignore empty transactions', async () => {
    const tx: TransactionEvent = new TestTransactionEvent();
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should ignore apply_new_fee calls to other contracts', async() => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: SENDERS[0],
        input: POOL_PROXY_IFACE.encodeFunctionData(
          "apply_new_fee",
          [createAddress('0x1')],
        ),
        output: '',
        to: createAddress('0x2'),
      });
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]); 
  });

  it('should detect apply_new_fee calls to the proxy pool contract', async() => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: SENDERS[0],
        input: POOL_PROXY_IFACE.encodeFunctionData(
          "apply_new_fee",
          [createAddress('0x3')],
        ),
        output: POOL_PROXY_IFACE.encodeFunctionResult('apply_new_fee'),
        to: TARGET,
      });
    const findings = await handler(tx);
    console.log(findings);
    expect(findings).toStrictEqual([
      createFinding(createAddress('0x3')),
    ]); 
  });

});
