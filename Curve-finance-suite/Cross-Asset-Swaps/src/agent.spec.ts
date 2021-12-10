import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from 'forta-agent';
import {
  provideCrossAssetSwap,
  CROSS_CHAIN_SWAP_IFACE as IFACE,
} from './agent';
import { 
  createAddress, 
  encodeParameter, 
  TestTransactionEvent, 
} from 'forta-agent-tools';

const TARGET = createAddress('0xdead');
const ALERT_ID = 'cross-asset-swap-test';

const createFinding = (
  tokenId: string, 
  owner: string, 
  synth: string, 
  balance: string
) => Finding.fromObject({
  name: "Cross Asset Swaps Interaction",
  description: "TokenUpdate event emitted",
  alertId: ALERT_ID,
  protocol: "Curve Finance",
  type: FindingType.Info,
  severity: FindingSeverity.Info,
  metadata: {
    tokenId,
    owner,
    synth,
    balance,
  },
});

describe('Cross Swap Agent tests suite', () => {
  const handler: HandleTransaction = provideCrossAssetSwap(
    ALERT_ID,
    TARGET,
  );

  it('should ignore empty transactions', async () => {
    const tx: TransactionEvent = new TestTransactionEvent();
    
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should ignore events emitted in other contracts', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        IFACE.getEvent('TokenUpdate').format("sighash"),
        createAddress('0xcafe'),
        encodeParameter('uint256', 200),
        encodeParameter('uint256', 20),
        encodeParameter('address', createAddress("0xc1")),
        encodeParameter('address', createAddress("0xc2")),
      )
      .addEventLog(
        IFACE.getEvent('TokenUpdate').format("sighash"),
        createAddress('0xffff'),
        encodeParameter('uint256', 1),
        encodeParameter('uint256', 1),
        encodeParameter('address', createAddress("0xc12")),
        encodeParameter('address', createAddress("0xc23")),
      );

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should ignore other events', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        'TokenUpdated(uint256,address,address,uint256)',
        TARGET,
        encodeParameter('uint256', 200),
        encodeParameter('uint256', 20),
        encodeParameter('address', createAddress("0xc1")),
        encodeParameter('address', createAddress("0xc2")),
      )
      .addEventLog(
        'FooEvent(uint256,address,address,uint256)',
        TARGET,
        encodeParameter('uint256', 111),
        encodeParameter('uint256', 12),
        encodeParameter('address', createAddress("0xdead")),
        encodeParameter('address', createAddress("0xcafe")),
      );

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it('should detect the TokenUpdate events in the target address', async () => {
    const tx: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        IFACE.getEvent('TokenUpdate').format("sighash"),
        TARGET,
        encodeParameter('uint256', 200),
        encodeParameter('uint256', 20),
        encodeParameter('address', createAddress("0xc1")),
        encodeParameter('address', createAddress("0xc2")),
      )
      .addEventLog(
        IFACE.getEvent('TokenUpdate').format("sighash"),
        TARGET,
        encodeParameter('uint256', 111),
        encodeParameter('uint256', 12),
        encodeParameter('address', createAddress("0xa")),
        encodeParameter('address', createAddress("0xb")),
      );

    const findings = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding("20", createAddress("0xc1"), createAddress("0xc2"), "200"),
      createFinding("12", createAddress("0xa"), createAddress("0xb"), "111"),
    ]);
  });
});
