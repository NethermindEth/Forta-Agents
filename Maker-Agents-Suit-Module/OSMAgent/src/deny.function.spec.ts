import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';
import Web3 from 'web3';
import provideDenyFunctionAgent from './deny.function';
import {
  createAddress,
  TestTransactionEvent,
} from '@nethermindeth/general-agents-module';

const ADDRESS = createAddress('0x1');
const ALERT_ID = 'testID';
const ABI = new Web3().eth.abi;

describe('OSM Rely Function Agent', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideDenyFunctionAgent(ALERT_ID);
  });

  it('should return a finding for one of the OSM contract', async () => {
    const _from = createAddress('0x2');
    const _to = '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763'; // PIP_ETH
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
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Maker OSM DENY Function Agent',
        description: 'DENY Function is called',
        alertId: ALERT_ID,
        severity: FindingSeverity.Medium,
        type: FindingType.Unknown,
        metadata: {
          contract: _to,
        },
      }),
    ]);
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
