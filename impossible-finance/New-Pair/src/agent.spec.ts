import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
  createTransactionEvent,
} from 'forta-agent';

import { createAddress, TestTransactionEvent, encodeParameter } from 'forta-agent-tools';

import { provideHandleTransaction, SWAP_FACTORY_IFACE, PAIRCREATED_EVENT_SIGNATURE } from './agent';

const TARGET: string = createAddress('0x123');
const ALERT_ID: string = 'swap-factory-pair-created-test';

const createFinding = ( token0: string, token1: string, pair: string ) => Finding.fromObject({
  name: 'New pair created',
  description: 'A new pair has been created in Swap Factory V1',
  alertId: ALERT_ID,
  severity: FindingSeverity.Info,
  type: FindingType.Info,
  protocol: 'Impossible Finance',
  metadata: {
    token0: token0,
    token1: token1, 
    pair: pair,
  }
});

let token0Address = '0xab5801a7d398351b8be11c439e05c5b3259aec9a';
let token1Address = '0xab5801a7d398351b8be11c439e05c5b3259aec9b';
let pairAddress = '0xab5801a7d398351b8be11c439e05c5b3259aec9c';

describe('Swap-Factory-Pair-Created Agent test suite', () => {
  const handler: HandleTransaction = provideHandleTransaction(
    ALERT_ID,
    TARGET,
  );

  it('should ignore empty transactions', async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should ignore same events from other contracts', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        SWAP_FACTORY_IFACE.getEvent('PairCreated').format('sighash'),
        createAddress('0x456'),
        '',
        token0Address,
        token1Address,
        SWAP_FACTORY_IFACE.getEventTopic('PairCreated'),
      );

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should ignore different event from same contract', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        'IrrelevantEvent(address)',
        TARGET,
        '',
        token0Address,
        token1Address,
        SWAP_FACTORY_IFACE.getEventTopic('PairCreated'),
      );

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should detect events from the contract', async () => {
    let token0Address = '0xab5801a7d398351b8be11c439e05c5b3259aec9c';
    let token1Address = '0xab5801a7d398351b8be11c439e05c5b3259aec9d';   

    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
      SWAP_FACTORY_IFACE.getEvent('PairCreated').format('sighash'),
      TARGET,
      '',
      token0Address,
      token1Address,
      SWAP_FACTORY_IFACE.getEventTopic('PairCreated'),
    );

    const findings = await handler(tx);
    
    expect(findings).toStrictEqual([
      createFinding(
        token0Address,
        token1Address,
	pairAddress,
      ),
    ]);
  });
});
