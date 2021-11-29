import {
  Finding,
  HandleTransaction,
  createTransactionEvent,
  TransactionEvent,
} from 'forta-agent';
import provideKillMeAgent, { web3, killme } from '../agents/kill.me';
import { encodeFunctionSignature, provideFunctionCallsDetectorHandler, TestTransactionEvent} from "forta-agent-tools";
import KILL_ME_SIGNATURE from '../agents/kill.me';
import { CollectionsOutlined } from '@material-ui/icons';

const ADDRESS = '0x1111';
const ALERTID = 'test';

describe('Kill me agent for Curve StableSwap contract', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideKillMeAgent(ALERTID, ADDRESS);
  });

  const createTxEvent = (signature: string) =>
    createTransactionEvent({
      transaction: { data: signature } as any,
      addresses: { ADDRESS: true },
      receipt: {} as any,
      block: {} as any,
    });

  it('should return kill_me function call finding', async () => {

    const signature: string = KILL_ME_SIGNATURE.toString();
    const selector: string = encodeFunctionSignature(signature);

    const txEvent1: TransactionEvent = new TestTransactionEvent().addTraces({
      input: selector,
    });

    
    const findings = await handleTransaction(txEvent1);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Kill Me funciton called',
        description: 'Kill Me funciton called on pool',
        alertId: ALERTID,
        protocol: 'ethereum',
        severity: 2,
        type: 2,
        everestId: undefined,
        metadata: {},
      }),
    ]);
  });
});
