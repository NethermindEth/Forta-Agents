import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';
import provideCrossAssetSwap, {
  CROSS_CHAIN_SWAP_SIGNATURE,
} from '../agents/cross.asset.swap';
import createTxEventWithLog from '../utils/create.event.log';

const ADDRESS = '0x1212';
const ALERT_ID = 'test';

describe('Cross Swap Agent', () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideCrossAssetSwap(ALERT_ID, ADDRESS);
  });

  it('create and send a tx with the tx event', async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      CROSS_CHAIN_SWAP_SIGNATURE,
      ADDRESS
    );
    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: 'CrossChainSwap funciton called',
        description: 'CrossChainSwap funciton called on pool',
        alertId: ALERT_ID,
        severity: FindingSeverity.Low,
        type: FindingType.Suspicious,
        metadata: {
          data: ADDRESS,
        },
      }),
    ]);
  });
});
