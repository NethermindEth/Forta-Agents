import {
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import agent, { web3, CrossChainSwap } from "./crossAssetSwap";

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
    const topic = web3.eth.abi.encodeEventSignature(CrossChainSwap);
    const event = {
      topics: [topic],
    };
    const tx = createTxEvent(event);
    const findings = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "CrossChainSwap Me funciton called",
        description: "CrossChainSwap Me funciton called on pool",
        alertId: "NETHFORTA-24-4",
        protocol: "ethereum",
        severity: 2,
        type: 2,
        everestId: undefined,
        metadata: {
          data: '[{"topics":["0x9f93cf34904cf7574290d700588e3c627086db9aeaf26df5e0cc123c62937bab"]}]',
        },
      }),
    ]);
  });
});
