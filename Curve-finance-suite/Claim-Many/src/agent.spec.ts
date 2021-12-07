import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from 'forta-agent';
import { createAddress, TestTransactionEvent } from 'forta-agent-tools';
import { 
  provideHandleTransaction,
  FD_IFACE,
} from './agent';

const TARGET: string = createAddress('0xdead');
const ALERT_ID: string = 'claim-many-test';
const RECEIVERS: string[] = [];
const SENDERS: string[] = [];

const createFinding = (sender: string, addresses: string[]) => Finding.fromObject({
  name: 'CurveDAO Fee Distribution contract called',
  description: 'Function claim_many executed',
  alertId: ALERT_ID,
  severity: FindingSeverity.Low,
  type: FindingType.Info,
  protocol: "Curve Finance",
  metadata:{
    from: sender,
    receivers: JSON.stringify(addresses),
  },
});

describe('ClaimMany Agent tests suite', () => {
  const handler: HandleTransaction = provideHandleTransaction(
    ALERT_ID,
    TARGET,
  );

  beforeAll(() => {
    for(let i = 0; i <= 30; ++i){
      RECEIVERS.push(createAddress(`0xa${i}`));
      SENDERS.push(createAddress(`0xb${i}`));
    }
  });

  it('should ignore empty transactions', async () => {
    const tx: TransactionEvent = new TestTransactionEvent();
    
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should ignore claim_many calls to other contracts', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: SENDERS[0],
        input: FD_IFACE.encodeFunctionData(
          "claim_many",
          [RECEIVERS.slice(0, 20)],
        ),
        output: FD_IFACE.encodeFunctionResult(
          "claim_many",
          [true],
        ),
        to: createAddress('0xcafe'),
      }, {
        from: SENDERS[1],
        input: FD_IFACE.encodeFunctionData(
          "claim_many",
          [RECEIVERS.slice(3, 23)],
        ),
        output: FD_IFACE.encodeFunctionResult(
          "claim_many",
          [true],
        ),
        to: createAddress('0xdead1'),
      });
    
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should ignore failed claim_many calls', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: SENDERS[2],
        input: FD_IFACE.encodeFunctionData(
          "claim_many",
          [RECEIVERS.slice(10, 30)],
        ),
        output: FD_IFACE.encodeFunctionResult(
          "claim_many",
          [false],
        ),
        to: TARGET,
      }, {
        from: SENDERS[3],
        input: FD_IFACE.encodeFunctionData(
          "claim_many",
          [RECEIVERS.slice(9, 29)],
        ),
        output: FD_IFACE.encodeFunctionResult(
          "claim_many",
          [false],
        ),
        to: TARGET,
      });
    
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should detect multiple calls', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        from: SENDERS[10],
        input: FD_IFACE.encodeFunctionData(
          "claim_many",
          [RECEIVERS.slice(1, 21)],
        ),
        output: FD_IFACE.encodeFunctionResult(
          "claim_many",
          [true],
        ),
        to: TARGET,
      }, {
        from: SENDERS[30],
        input: FD_IFACE.encodeFunctionData(
          "claim_many",
          [RECEIVERS.slice(5, 25)],
        ),
        output: FD_IFACE.encodeFunctionResult(
          "claim_many",
          [true],
        ),
        to: TARGET,
      }, {
        from: SENDERS[23],
        input: FD_IFACE.encodeFunctionData(
          "claim_many",
          [RECEIVERS.slice(0, 20)],
        ),
        output: FD_IFACE.encodeFunctionResult(
          "claim_many",
          [true],
        ),
        to: TARGET,
      });
    
    const findings = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding(SENDERS[10], RECEIVERS.slice(1, 21)),
      createFinding(SENDERS[30], RECEIVERS.slice(5, 25)),
      createFinding(SENDERS[23], RECEIVERS.slice(0, 20)),
    ]);
  });
});
