import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import agent, {
  web3,
  RemoveLiquidityImbalance,
} from "./removeImbalanceLiquidity";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  const createTxEvent = (event: any) =>
    createTransactionEvent({
      transaction: {} as any,
      addresses: { "0xDeBF20617708857ebe4F679508E7b7863a8A8EeE": true },
      receipt: { logs: [event] } as any,
      block: {} as any,
    });

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  it("create and send a tx with the tx event", async () => {
    const topic = web3.eth.abi.encodeEventSignature(RemoveLiquidityImbalance);
    const event = {
      topics: [topic],
    };
    const tx = createTxEvent(event);
    const findings = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "RemoveLiquidityImbalance Me funciton called",
        description: "RemoveLiquidityImbalance Me funciton called on pool",
        alertId: "NETHFORTA-24-3",
        protocol: "ethereum",
        severity: 2,
        type: 2,
        everestId: undefined,
        metadata: {
          data: '[{"topics":["0xc003cc4c452657786dfe4207bf161d97addab7dac3b050db2eca78cd859a9088"]}]',
        },
      }),
    ]);
  });
});
