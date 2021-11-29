import {
  Finding,
  HandleTransaction,
  TransactionEvent,
} from 'forta-agent';
import provideKillMeAgent from '../agents/kill.me';
import { encodeFunctionSignature, TestTransactionEvent} from "forta-agent-tools";
import KILL_ME_SIGNATURE from '../agents/kill.me';

const ADDRESS = '0x1111';
const ALERTID = 'test';

describe('Kill me agent for Curve StableSwap contract', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideKillMeAgent(ALERTID, ADDRESS);
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
        name: 'Kill Me function call Detected',
        description: 'Kill Me function called on pool',
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
