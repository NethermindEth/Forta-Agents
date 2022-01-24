import BigNumber from 'bignumber.js';
import { HandleTransaction } from 'forta-agent';
import { createAddress, TestTransactionEvent } from 'forta-agent-tools';
import { provideHandleTransaction } from './agent';
import { createFinding, hexToNumber } from './utils';

const TEST_ADDRESSES = [
  createAddress('0x1'),
  createAddress('0x2'),
  createAddress('0x3'),
];

describe('high gas agent', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(TEST_ADDRESSES);
  });

  it('should return empty finding', async () => {
    const tx = new TestTransactionEvent();

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding if gas used properly', async () => {
    const tx = new TestTransactionEvent().setTo(TEST_ADDRESSES[0]);
    tx.transaction.gasPrice = '0x1A13B8600'; // 7 GWei

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding if gas used as 10', async () => {
    const tx = new TestTransactionEvent().setTo(TEST_ADDRESSES[0]);
    tx.transaction.gasPrice = '0x2540BE400'; // 10 GWei

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding if wrong address used', async () => {
    const tx = new TestTransactionEvent().setTo(createAddress('0x6'));
    tx.transaction.gasPrice = '0x28FA6AE00'; // 11 GWei

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it('should return a finding if gas used above 10', async () => {
    const tx = new TestTransactionEvent().setTo(TEST_ADDRESSES[0]);
    tx.transaction.gasPrice = '0x28FA6AE00'; // 11 GWei

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([
      createFinding(TEST_ADDRESSES[0], hexToNumber('0x28FA6AE00').toString()),
    ]);
  });
});
