import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
} from 'forta-agent';
import {
  createAddress,
  encodeParameter,
  TestTransactionEvent,
} from 'forta-agent-tools';
import { provideHandleTransaction } from './agent';

const pushFinding = (
  prevOwner: string,
  newOwner: string,
  bond: string
): Finding =>
  Finding.fromObject({
    name: 'OlympusDAO Bond Ownership event detected',
    description: 'OwnershipPushed event',
    alertId: 'olympus-10-1',
    severity: FindingSeverity.High,
    type: FindingType.Info,
    protocol: 'OlympusDAO',
    metadata: {
      bond: bond,
      previousOwner: prevOwner,
      newOwner: newOwner,
    },
  });

const pullFinding = (
  prevOwner: string,
  newOwner: string,
  bond: string
): Finding =>
  Finding.fromObject({
    name: 'OlympusDAO Bond Ownership event detected',
    description: 'OwnershipPulled event',
    alertId: 'olympus-10-2',
    severity: FindingSeverity.High,
    type: FindingType.Info,
    protocol: 'OlympusDAO',
    metadata: {
      bond: bond,
      previousOwner: prevOwner,
      newOwner: newOwner,
    },
  });

const test_bonds = [
  createAddress('0x1'),
  createAddress('0x2'),
  createAddress('0x3'),
];

describe('Bond - Ownership Changes', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(test_bonds);
  });

  it('should return empty finding', async () => {
    const txn = new TestTransactionEvent();

    const findings: Finding[] = await handleTransaction(txn);

    expect(findings).toEqual([]);
  });

  it('should return empty finding if wrong event', async () => {
    const txn = new TestTransactionEvent().addEventLog(
      'wrongEvent()',
      test_bonds[0],
      '0x',
      encodeParameter('address', createAddress('0x4')),
      encodeParameter('address', createAddress('0x5'))
    );

    const findings: Finding[] = await handleTransaction(txn);

    expect(findings).toEqual([]);
  });

  it('should return empty finding if wrong bond', async () => {
    const txn = new TestTransactionEvent().addEventLog(
      'OwnershipPushed(address,address)',
      createAddress('0x4'), // wrong bond
      '0x',
      encodeParameter('address', createAddress('0x6')),
      encodeParameter('address', createAddress('0x7'))
    );

    const findings: Finding[] = await handleTransaction(txn);

    expect(findings).toEqual([]);
  });

  it('should return finding for OwnershipPushed', async () => {
    const txn = new TestTransactionEvent()
      .addEventLog(
        'OwnershipPushed(address,address)',
        test_bonds[0],
        '0x',
        encodeParameter('address', createAddress('0x4')),
        encodeParameter('address', createAddress('0x5'))
      )
      .addEventLog(
        'OwnershipPushed(address,address)',
        test_bonds[1],
        '0x',
        encodeParameter('address', createAddress('0x4')),
        encodeParameter('address', createAddress('0x5'))
      );

    const findings: Finding[] = await handleTransaction(txn);

    expect(findings).toEqual([
      pushFinding(createAddress('0x4'), createAddress('0x5'), test_bonds[0]),
      pushFinding(createAddress('0x4'), createAddress('0x5'), test_bonds[1]),
    ]);
  });

  it('should return finding for OwnershipPulled', async () => {
    const txn = new TestTransactionEvent()
      .addEventLog(
        'OwnershipPulled(address,address)',
        test_bonds[0],
        '0x',
        encodeParameter('address', createAddress('0x4')),
        encodeParameter('address', createAddress('0x5'))
      )
      .addEventLog(
        'OwnershipPulled(address,address)',
        test_bonds[1],
        '0x',
        encodeParameter('address', createAddress('0x4')),
        encodeParameter('address', createAddress('0x5'))
      );

    const findings: Finding[] = await handleTransaction(txn);

    expect(findings).toEqual([
      pullFinding(createAddress('0x4'), createAddress('0x5'), test_bonds[0]),
      pullFinding(createAddress('0x4'), createAddress('0x5'), test_bonds[1]),
    ]);
  });

  it('should return finding for OwnershipPushed and OwnershipPulled', async () => {
    const txn = new TestTransactionEvent()
      .addEventLog(
        'OwnershipPushed(address,address)',
        test_bonds[0],
        '0x',
        encodeParameter('address', createAddress('0x4')),
        encodeParameter('address', createAddress('0x5'))
      )
      .addEventLog(
        'OwnershipPulled(address,address)',
        test_bonds[0],
        '0x',
        encodeParameter('address', createAddress('0x4')),
        encodeParameter('address', createAddress('0x5'))
      );

    const findings: Finding[] = await handleTransaction(txn);

    expect(findings).toEqual([
      pushFinding(createAddress('0x4'), createAddress('0x5'), test_bonds[0]),
      pullFinding(createAddress('0x4'), createAddress('0x5'), test_bonds[0]),
    ]);
  });
});
