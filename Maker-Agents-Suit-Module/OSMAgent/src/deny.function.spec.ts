import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';
import Web3 from 'web3';
import provideDenyFunctionHandler, { createFinding } from './deny.function';
import {
  createAddress,
  TestTransactionEvent,
} from '@nethermindeth/general-agents-module';
import { OSM_CONTRACTS } from './utils';

const ADDRESS = createAddress('0x1');
const ABI = new Web3().eth.abi;

describe('OSM Rely Function Agent', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideDenyFunctionHandler(OSM_CONTRACTS);
  });

  it('should return a finding for one of the OSM contract', async () => {
    const _from = createAddress('0x2');
    const _to = '0x81fe72b5a8d1a857d176c3e7d5bd2679a9b85763'; // PIP_ETH
    const _input: string = ABI.encodeFunctionCall(
      {
        name: 'deny',
        type: 'function',
        inputs: [
          {
            type: 'address',
            name: '_operator',
          },
        ],
      },
      [ADDRESS]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent().addTrace({
      to: _to,
      from: _from,
      input: _input,
    });

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([ createFinding({ to: _to })]);
  });

  it('should return empty finding when OSM contract address does found', async () => {
    const _from = createAddress('0x2');
    const _to = '0x1'; // BAD ADDRESS
    const _input: string = ABI.encodeFunctionCall(
      {
        name: 'deny',
        type: 'function',
        inputs: [
          {
            type: 'address',
            name: '_operator',
          },
        ],
      },
      [ADDRESS]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent().addTrace({
      to: _to,
      from: _from,
      input: _input,
    });

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
