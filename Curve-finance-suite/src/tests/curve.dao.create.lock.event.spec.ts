import {
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from 'forta-agent';
import providecreateLockAgent, {
  web3,
  createLock,
} from '../agents/curve.dao.create.lockevent';

const ADDRESS = '0x1111';
const ALERTID = 'test';

describe('high gas agent', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = providecreateLockAgent(ALERTID, ADDRESS);
  });

  const createTxEvent = (signature: string) =>
    createTransactionEvent({
      transaction: { data: signature } as any,
      addresses: { ADDRESS: true },
      receipt: {} as any,
      block: {} as any,
    });

  it('create and send a tx with the tx event', async () => {
    const signature = web3.eth.abi.encodeFunctionCall(createLock as any, [
      '1000',
      '100',
    ]);
    const tx = createTxEvent(signature);
    const findings = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'Create Lock Event called',
        description: 'Create Lock Event funciton called on pool',
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
