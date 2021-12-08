import {
  FindingType,
  Finding,
  HandleTransaction,
  TransactionEvent
} from "forta-agent"
import { 
  createAddress, 
  encodeParameters, 
  TestTransactionEvent 
} from "forta-agent-tools";
import { 
  provideRemoveLiquidityImbalanceAgent, 
  iface 
} from "./agent"

const ADDRESS = createAddress('0x1');
const ALERTID = 'remove-liquidity-imbalance';

const createFinding = (pool_address: string, token_supply: string) => Finding.fromObject({
  name: 'RemoveLiquidityImbalance event Detected',
  description: 'RemoveLiquidityImbalance event emitted',
  alertId: ALERTID,
  severity: 2,
  type: FindingType.Info,
  protocol: 'Curve Finance',
  metadata: {
    pool_address: pool_address,
    token_supply: token_supply
  },
});

describe('Remove liquidity imbalance Agent tests suite', () => {
  const handleTransaction: HandleTransaction = provideRemoveLiquidityImbalanceAgent(ALERTID, ADDRESS);
  const data = encodeParameters(
    ["uint256[3]","uint256[3]","uint256", "uint256"],
    [[1,2,3], [1,2,3], 3, 5]
  );

  it('Should return an empty findings when no event is emitted', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
    
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });


  it('Should return a finding when RemoveLiquidityImbalance event is emitted', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      iface.getEvent('RemoveLiquidityImbalance').format('sighash'),
      ADDRESS,
      data
    );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([createFinding(ADDRESS,'5')]);
  });

  it('Should return an empty findings because of wrong signature', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      'signature()',
      ADDRESS,
      data
    );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

  });

  it('Should ignore events emitted by other contracts', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      iface.getEvent('RemoveLiquidityImbalance').format('sighash'),
      createAddress('0x2'),
      data
    );
    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});