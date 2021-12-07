/*
import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';
import { createAddress, encodeParameters, TestTransactionEvent } from 'forta-agent-tools';
import provideApplyNewFeesAgent, { NEW_FEE_EVENT_SIG } from '../agents/apply.newfee';

import createTxEventWithLog from '../utils/create.event.log';

const ADDRESS = createAddress('0X1111');
const ALERT_ID = 'NETHFORTA-21-11';

describe('Add Pool agent', () => {
  let handleTransactions: HandleTransaction;

  beforeAll(() => {
    handleTransactions = provideApplyNewFeesAgent(ALERT_ID, ADDRESS);
  });

  it('should create a finding', async () => {
    const data = encodeParameters(
      ['address'],
      [ADDRESS]
    );
    
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      NEW_FEE_EVENT_SIG,
      ADDRESS,
      data
    );
    
 
    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'NewFee set',
        description: 'DAO has assigned a new fee to a pool',
        alertId: ALERT_ID,
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          address: ADDRESS,
        }
      }),
    ]);
  });

  it('should return empty finding', async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      'Wrong Signature',
      '0x123'
    );

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
*/

import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from 'forta-agent';

import { createAddress, TestTransactionEvent } from 'forta-agent-tools';

import { provideHandleTransaction, NEW_FEE_EVENT_SIG } from './agent';

const TARGET: string = createAddress('0xdead');
const ALERT_ID: string = 'newfee-test';
const RECEIVERS: string[] = [];
const SENDERS: string[] = [];
const TOPIC: string = "0xbe12859b636aed607d5230b2cc2711f68d70e51060e6cca1f575ef5d2fcc95d1";

const createFinding = (pool: string, data: string) => Finding.fromObject({
  name: 'CurveDAO Pool Owner contract called',
  description: 'Function NewFee executed',
  alertId: ALERT_ID,
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  metadata: {
    affected_pool: pool, 
    data: data,
    topic: TOPIC,
  },
});

describe('NewFee Agent tests suite', () => {
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

  it('should ignore NewFee events in txs not related to pool proxy', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(NEW_FEE_EVENT_SIG);
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should ignore txs with unrelated event', async () => {
  });

  it('should detect NewFee events in txs related to pool proxy', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(NEW_FEE_EVENT_SIG, TARGET);
    const findings = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding('0x000000000000000000000000000000000000dead', ''),
    ]);
  });

});
