import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
} from 'forta-agent';
import { createAddress, TestTransactionEvent } from 'forta-agent-tools';
import { provideHandlTransaction } from './agent';
import { ethers } from 'ethers';
import { ABIs } from './utils';

const test_bonds = [
  createAddress('0x1'),
  createAddress('0x2'),
  createAddress('0x3'),
];

describe('Bond - Policy Methods Agents Test Suit', () => {
  let handleTransaction: HandleTransaction;
  let contractInterface: ethers.utils.Interface;

  beforeAll(() => {
    handleTransaction = provideHandlTransaction(test_bonds);
    contractInterface = new ethers.utils.Interface(ABIs);
  });

  it('should return empty findings', async () => {
    const txn = new TestTransactionEvent();
    const findings = await handleTransaction(txn);

    expect(findings).toStrictEqual([]);
  });

  it('should return finding if `setBondTerms` function is called', async () => {
    const txn = new TestTransactionEvent().addTraces({
      to: test_bonds[0],
      input: contractInterface.encodeFunctionData('setBondTerms', [0, 100001]),
    });
    const findings = await handleTransaction(txn);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'OlympusDAO Bond Policy Methods Agent',
        description: 'A Policy method is called',
        alertId: 'olympus-12',
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: 'OlympusDAO',
        metadata: {
          bond: test_bonds[0],
          functionName: 'setBondTerms',
        },
      }),
    ]);
  });

  it('should return finding if `setAdjustment` function is called', async () => {
    const txn = new TestTransactionEvent().addTraces({
      to: test_bonds[0],
      input: contractInterface.encodeFunctionData('setAdjustment', [
        true,
        0,
        0,
        0,
      ]),
    });
    const findings = await handleTransaction(txn);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'OlympusDAO Bond Policy Methods Agent',
        description: 'A Policy method is called',
        alertId: 'olympus-12',
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: 'OlympusDAO',
        metadata: {
          bond: test_bonds[0],
          functionName: 'setAdjustment',
        },
      }),
    ]);
  });

  it('should return finding if `setStaking` function is called', async () => {
    const txn = new TestTransactionEvent().addTraces({
      to: test_bonds[0],
      input: contractInterface.encodeFunctionData('setStaking', [
        createAddress('0x4'),
        true,
      ]),
    });
    const findings = await handleTransaction(txn);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'OlympusDAO Bond Policy Methods Agent',
        description: 'A Policy method is called',
        alertId: 'olympus-12',
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: 'OlympusDAO',
        metadata: {
          bond: test_bonds[0],
          functionName: 'setStaking',
        },
      }),
    ]);
  });
});
