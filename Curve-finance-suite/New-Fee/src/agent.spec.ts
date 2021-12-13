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

const createFinding = (sender: string, pool: string) => Finding.fromObject({
  name: 'CurveDAO Pool Owner contract called',
  description: 'Function NewFee executed',
  alertId: ALERT_ID,
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: 'Curve Finance',
  metadata: {
    affected_pool: pool, 
    sender: sender,
  },
});

describe('NewFee Agent tests suite', () => {
  const handler: HandleTransaction = provideHandleTransaction(
    ALERT_ID,
    TARGET,
  );

  it('should return 0 findings in empty transactions', async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should return 0 findings in apply_new_fee calls to other contracts', async() => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: createAddress('0xcafe'),
        input: POOL_PROXY_IFACE.encodeFunctionData(
          "apply_new_fee",
          [createAddress('0x1')],
        ),
        output: '0x',
        to: createAddress('0x2'),
      });

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]); 
  });

  it('should detect apply_new_fee calls to the proxy pool contract', async() => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: createAddress('0xfff'),
        input: POOL_PROXY_IFACE.encodeFunctionData(
          "apply_new_fee",
          [createAddress('0x3')],
        ),
        output: '0x',
        to: TARGET,
      });
    const findings = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding(createAddress('0xfff'), createAddress('0x3')),
    ]); 
  });

  it('should detect multiple apply_new_fee calls to the proxy pool contract', async() => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: createAddress('0xdad'),
        input: POOL_PROXY_IFACE.encodeFunctionData(
          "apply_new_fee",
          [createAddress('0x1')],
        ),
        output: '0x',
        to: TARGET,
      },{
        from: createAddress('0xbee'),
        input: POOL_PROXY_IFACE.encodeFunctionData(
          "apply_new_fee",
          [createAddress('0x2')],
        ),
        output: '0x',
        to: TARGET,
      },{
        from: createAddress('0xdead'),
        input: POOL_PROXY_IFACE.encodeFunctionData(
          "apply_new_fee",
          [createAddress('0x3')],
        ),
        output: '0x',
        to: TARGET,
      },);
    const findings = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding(createAddress('0xdad'), createAddress('0x1')),
      createFinding(createAddress('0xbee'), createAddress('0x2')),
      createFinding(createAddress('0xdead'), createAddress('0x3')),
    ]); 
  });
});
