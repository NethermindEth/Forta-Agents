import { Finding, HandleTransaction, TransactionEvent } from 'forta-agent';
import { createAddress, encodeParameters, TestTransactionEvent } from 'forta-agent-tools';
import provideRemoveLiquidityImbalanceAgent, {
  REMOVE_LIQUIDITY_IMBALANCE_SIGNATURE,
} from '../agents/remove.imbalance.liquidity';

import createTxEventWithLog from '../utils/create.event.log';

const ADDRESS = createAddress('0x1');
const ALERTID = 'test';

describe('Remove imbalance liquidity agent for StableSwap Exchange contract', () => {
  let handleTransaction: HandleTransaction;
  const data = encodeParameters(
    ["address","uint256[3]","uint256[3]","uint256", "uint256"],
    [ADDRESS, [1,2,3],[1,2,3],3,5]
  );

  beforeAll(() => {
    handleTransaction = provideRemoveLiquidityImbalanceAgent(ALERTID, ADDRESS);
  });

  it('Should return a finding when RemoveLiquidityImbalance event is emitted', async () => {

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      REMOVE_LIQUIDITY_IMBALANCE_SIGNATURE,
      ADDRESS,
      data
    );
    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'RemoveLiquidityImbalance event Detected',
        description: 'RemoveLiquidityImbalance event emitted on pool',
        alertId: ALERTID,
        protocol: 'ethereum',
        severity: 2,
        type: 2,
        everestId: undefined,
        metadata: {
          provider: ADDRESS,
          token_supply: '5'
        },
      }),
    ]);
  });

  it('Should return an empty finding because of wrong address', async () => {

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      'signature()',
      ADDRESS,
      data
    );
    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);

  });

  it('Should return an empty finding because of wrong signature', async () => {

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      REMOVE_LIQUIDITY_IMBALANCE_SIGNATURE,
      createAddress('0x2'),
      data
    );
    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
