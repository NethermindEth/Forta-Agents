import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
} from 'forta-agent';
import { createAddress } from 'forta-agent-tools';
import { provideHandlTransaction } from './agent';

const test_bonds = [
  createAddress('0x1'),
  createAddress('0x2'),
  createAddress('0x3'),
];

describe('Bond - Policy Methods Agents Test Suit', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideHandlTransaction(test_bonds);
  });
});
