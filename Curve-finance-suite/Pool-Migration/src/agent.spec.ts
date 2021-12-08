import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent
} from 'forta-agent';
import Web3 from 'web3';
import { provideMigratePoolAgent } from './agent';
import {
  createAddress,
  TestTransactionEvent,
} from "forta-agent-tools";

const abi = new Web3().eth.abi;
const ADDRESS = '0x1111';
const ALERT_ID = 'test';

describe('Pool Migration Agent', () => {
  let handleTransactions: HandleTransaction;

  beforeAll(() => {
    handleTransactions = provideMigratePoolAgent(ALERT_ID, ADDRESS);
  });

  it('should return a finding', async () => {
    const _old_pool = createAddress('0x1');
    const _new_pool = createAddress('0x2');
    const _amount = '1000'
    const _from = createAddress('0x3');
    const _input: string = abi.encodeFunctionCall(
      {
        name: 'migrate_to_new_pool',
        type: 'function',
        inputs: [
          {
            type: 'address',
            name: '_old_pool',
          },
          {
            type: 'address',
            name: '_new_pool',
          },
          {
            type: 'uint256',
            name: '_amount',
          },
        ],
      },
      [_old_pool, _new_pool, _amount]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: _from,
      to: ADDRESS,
      input: _input
    });

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Pool Migration Finding",
        description: "Pool migrated to new address",
        alertId: ALERT_ID,
        severity: FindingSeverity.Medium,
        type: FindingType.Unknown,
        metadata: {
          from: _from,
          to: ADDRESS,
          oldPool: _old_pool,
          newPool: _new_pool,
          amount: _amount
        },
      }),
    ]);
  });

  it('should return empty finding cause bad input', async () => {
    const _from = createAddress('0x3');
    const _input: string = 'bad sig';

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: _from,
      to: ADDRESS,
      input: _input
    });

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding cause bad function selector', async () => {
    const _old_pool = createAddress('0x1');
    const _new_pool = createAddress('0x2');
    const _amount = '1000';
    const _from = createAddress('0x3');

    const _input: string = abi.encodeFunctionCall(
      {
        name: 'wrong function selector',
        type: 'function',
        inputs: [
          {
            type: 'address',
            name: '_old_pool',
          },
          {
            type: 'address',
            name: '_new_pool',
          },
          {
            type: 'uint256',
            name: '_amount',
          },
        ],
      },
      [_old_pool, _new_pool, _amount]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: _from,
      to: ADDRESS,
      input: _input
    });

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
