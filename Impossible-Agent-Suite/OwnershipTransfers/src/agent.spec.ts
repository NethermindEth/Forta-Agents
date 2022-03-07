import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
} from 'forta-agent';
import { provideHandleTransaction } from './agent';
import {
  createAddress,
  encodeParameter,
  TestTransactionEvent,
} from 'forta-agent-tools';

const test_contracts = [
  createAddress('0x1'),
  createAddress('0x2'),
  createAddress('0x3'),
];

const createFinding = (contract: string, prev: string, newOwner: string) =>
  Finding.fromObject({
    name: 'Ownership Transfers Detection ',
    description: 'The ownership is trasferred.',
    alertId: 'IMPOSSIBLE-3',
    severity: FindingSeverity.High,
    type: FindingType.Info,
    protocol: 'Impossible Finance',
    metadata: {
      contract: contract,
      previousOwner: prev,
      newOwner: newOwner,
    },
  });

describe('Contract Upgrade Agent Test Suit', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(test_contracts);
  });

  it('should return empty finding', async () => {
    const tx = new TestTransactionEvent();

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it('should return empty finding if wrong contract directed', async () => {
    const tx = new TestTransactionEvent().addEventLog(
      'OwnershipTransferred(address,address)',
      createAddress('0x6'),
      '0x',
      encodeParameter('address', createAddress('0x4')),
      encodeParameter('address', createAddress('0x5'))
    );

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it('should return finding', async () => {
    const tx = new TestTransactionEvent().addEventLog(
      'OwnershipTransferred(address,address)',
      test_contracts[0],
      '0x',
      encodeParameter('address', createAddress('0x4')),
      encodeParameter('address', createAddress('0x5'))
    );

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([
      createFinding(
        test_contracts[0],
        createAddress('0x4'),
        createAddress('0x5')
      ),
    ]);
  });

  it('should return finding for two ownership transfers', async () => {
    const tx = new TestTransactionEvent()
      .addEventLog(
        'OwnershipTransferred(address,address)',
        test_contracts[1],
        '0x',
        encodeParameter('address', createAddress('0x4')),
        encodeParameter('address', createAddress('0x5'))
      )
      .addEventLog(
        'OwnershipTransferred(address,address)',
        test_contracts[1],
        '0x',
        encodeParameter('address', createAddress('0x5')),
        encodeParameter('address', createAddress('0x6'))
      );

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([
      createFinding(
        test_contracts[1],
        createAddress('0x4'),
        createAddress('0x5')
      ),
      createFinding(
        test_contracts[1],
        createAddress('0x5'),
        createAddress('0x6')
      ),
    ]);
  });
});
