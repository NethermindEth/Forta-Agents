import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
  Trace,
} from 'forta-agent';
import Web3 from 'web3';
import provideRelyFunctionAgent from './OSM.rely.function.agent';
import {
  createAddress,
  TestTransactionEvent,
} from '@nethermindeth/general-agents-module';

interface TraceInfo {
  from: string;
  to: string;
  input: string;
}

const ADDRESS = createAddress('0x1');
const ALERT_ID = 'testID';
const ABI = new Web3().eth.abi;

describe('OSM Rely Function Agent', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideRelyFunctionAgent(ALERT_ID);
  });

  it('should return a finding for one of the OSM contract', async () => {
    const _from = createAddress('0x2');
    const _to = '0x32d8416e8538Ac36272c44b0cd962cD7E0198489';
    const _input: string = ABI.encodeFunctionCall(
      {
        name: 'rely',
        type: 'function',
        inputs: [
          {
            type: 'address',
            name: 'usr',
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
        name: 'Maker OSM Contract RELY Function Agent',
        description: 'RELY Function is called',
        alertId: ALERT_ID,
        severity: FindingSeverity.Medium,
        type: FindingType.Unknown,
        metadata: {
          usr: _input,
        },
      }),
    ]);
  });
});
