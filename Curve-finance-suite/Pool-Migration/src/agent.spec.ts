import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent
} from 'forta-agent';
import {
  provideMigratePoolAgent,
  PM_IFACE
} from './agent';
import {
  createAddress,
  TestTransactionEvent,
  encodeFunctionCall
} from "forta-agent-tools";

const ADDRESS = createAddress('0x1111');
const ALERT_ID = 'test';

const createFinding = (oldPool: string, newPool: string, amount: string) => Finding.fromObject({
  name: "Pool Migration Finding",
  description: "Pool migrated to new address",
  alertId: ALERT_ID,
  severity: FindingSeverity.Medium,
  type: FindingType.Unknown,
  metadata:{
    oldPool,
    newPool,
    amount
  },
});

describe('Pool Migration Agent', () => {
  let handleTransactions: HandleTransaction;

  const _old_pool = createAddress('0x1');
  const _new_pool = createAddress('0x2');
  const _amount = '1000'
  const _from = createAddress('0x3');

  const _input = PM_IFACE.encodeFunctionData(
    'migrate_to_new_pool',
    [_old_pool, _new_pool, _amount]
  );

  beforeAll(() => {
    handleTransactions = provideMigratePoolAgent(ALERT_ID, ADDRESS);
  });

  it('should return a Finding from a call to migrate_to_new_pool', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: _from,
      to: ADDRESS,
      input: _input
    });

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([
      createFinding(_old_pool, _new_pool, _amount)
    ]);
  });

  it('should return no Finding because of wrong function call', async () => {
    const _wrong_input: string = 'wrong function call signature';

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: _from,
      to: ADDRESS,
      input: _wrong_input
    });

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return no Finding because of calling wrong function', async () => {
    const _wrong_input: string = encodeFunctionCall(
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
      input: _wrong_input
    });

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it('should return multiple Findings from multiple function calls', async () => {
    const _old_pool_two = createAddress('0x4');
    const _new_pool_two = createAddress('0x5');
    const _amount_two = '2000'
    const _from_two = createAddress('0x6');

    const _input_two = PM_IFACE.encodeFunctionData(
      'migrate_to_new_pool',
      [_old_pool_two , _new_pool_two, _amount_two]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: _from,
      to: ADDRESS,
      input: _input
    }, {
      from: _from_two,
      to: ADDRESS,
      input: _input_two
    }
    );

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([
      createFinding(_old_pool, _new_pool, _amount),
      createFinding(_old_pool_two, _new_pool_two, _amount_two)
    ]);
  });

  it('should return no Finding because of calling wrong contract', async () => {
    const WRONG_CONTRACT_ADDRESS: string = createAddress('0x66');

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      from: _from,
      to: WRONG_CONTRACT_ADDRESS,
      input: _input
    });

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([]);
  })
});