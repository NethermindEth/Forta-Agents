import {
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import provideRemoveLiquidityImbalanceAgent, {
  web3,
  REMOVE_LIQUIDITY_IMBALANCE_SIGNATURE,
} from "../agents/removeImbalanceLiquidity";

const ADDRESS = "0x1111";
const ALERTID = "test";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideRemoveLiquidityImbalanceAgent(ALERTID, ADDRESS);
  });

  const createTxEvent = (event: any) =>
    createTransactionEvent({
      transaction: {} as any,
      addresses: { ADDRESS: true },
      receipt: { logs: [event] } as any,
      block: {} as any,
    });

  it("create and send a tx with the tx event", async () => {
    const topic = web3.eth.abi.encodeEventSignature(
      REMOVE_LIQUIDITY_IMBALANCE_SIGNATURE
    );
    const event = {
      topics: [topic],
    };
    const tx = createTxEvent(event);
    const findings = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "RemoveLiquidityImbalance Me funciton called",
        description: "RemoveLiquidityImbalance Me funciton called on pool",
        alertId: ALERTID,
        protocol: "ethereum",
        severity: 2,
        type: 2,
        everestId: undefined,
        metadata: {
          data: ADDRESS,
        },
      }),
    ]);
  });
});
