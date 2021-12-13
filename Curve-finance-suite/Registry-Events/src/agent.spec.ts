import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from 'forta-agent';
import { 
  createAddress, 
  TestTransactionEvent, 
  encodeParameter 
} from 'forta-agent-tools';
import { provideHandleTransaction } from './agent';
import { utils } from 'ethers';
import abi from './abi';

const TARGET: string = createAddress('0xdead');
const EVENTS: [string, string[], any][] = [];

const poolAddedFinding = (...params: string[]) => Finding.fromObject({
  name: 'Curve Registry contract called',
  description: 'Event PoolAdded has been emitted',
  alertId: "CURVE-13-1",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: 'Curve Finance',
  metadata: {
    pool: params[0],
    rate_method_id: params[1],
  }
});

const poolRemovedFinding = (...params: string[]) => Finding.fromObject({
  name: 'Curve Registry contract called',
  description: 'Event PoolRemoved has been emitted',
  alertId: "CURVE-13-2",
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: 'Curve Finance',
  metadata: {
    pool: params[0],
  }
});

describe('Registry-Events Agent tests suite', () => {
  const R_IFACE: utils.Interface = new utils.Interface(abi.REGISTRY);
  const handler: HandleTransaction = provideHandleTransaction({
    getRegistry: () => TARGET,
  } as any);

  beforeAll(() => {
    for(let i = 10; i <= 30; ++i) {
      const addr: string = createAddress(`0xabc${i}`);
      EVENTS.push(
        ['PoolAdded', [addr, `0x${i}`], poolAddedFinding],
        ['PoolRemoved', [addr], poolRemovedFinding],
      )
    }
  });

  it('should return 0 findings in empty transactions', async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should return 0 findings when events are emitted in other contracts', async () => {
    const encodedEvent = R_IFACE.encodeEventLog(
      R_IFACE.getEvent('PoolAdded'),
      [createAddress("0xffff"), "0x14"],
    );
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        createAddress("0xeda"),
        encodedEvent.data,
        ...encodedEvent.topics,
      );
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should return 0 findings when other events are emitted', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        'PoolsAdded(address,bytes)', // extra s
        TARGET,
        encodeParameter('bytes', '0xfe'),
        encodeParameter('address', createAddress('0xdad')),
    );
    
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should detect PoolAdded event from the target contract', async () => {   
    const encodedEvent = R_IFACE.encodeEventLog(
      R_IFACE.getEvent('PoolAdded'),
      [createAddress('0xbee'), "0xcafe"],
    );
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        TARGET,
        encodedEvent.data,
        ...encodedEvent.topics,
      );
  
    const findings = await handler(tx);
    expect(findings).toStrictEqual([
      poolAddedFinding(createAddress('0xbee'), "0xcafe"),
    ]);
  });

  it('should detect PoolRemoved event from the target contract', async () => {   
    const encodedEvent = R_IFACE.encodeEventLog(
      R_IFACE.getEvent('PoolRemoved'),
      [createAddress('0xefe')],
    );
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        TARGET,
        encodedEvent.data,
        ...encodedEvent.topics,
      );
  
    const findings = await handler(tx);
    expect(findings).toStrictEqual([
      poolRemovedFinding(createAddress('0xefe')),
    ]);
  });

  it('should detect multiple events', async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent();
    const expectedFindings: Finding[] = [];

    for(let [event, params, createFinding] of EVENTS) {
      const encodedEvent = R_IFACE.encodeEventLog(
        R_IFACE.getEvent(event),
        params,
      );
      tx.addAnonymousEventLog(
        TARGET,
        encodedEvent.data,
        ...encodedEvent.topics,
      );
      expectedFindings.push(createFinding(...params));
    }

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual(expectedFindings);
  });
});