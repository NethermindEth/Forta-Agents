import {
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from 'forta-agent';
import provideKillMeAgent, { web3, killme } from '../agents/kill.me';
import KILL_ME_SIGNATURE from '../agents/kill.me';

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
    const signature = web3.eth.abi.encodeFunctionCall(killme as any, []);
    const tx = createTxEvent(signature);
    const findings = await handleTransaction(tx);
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
