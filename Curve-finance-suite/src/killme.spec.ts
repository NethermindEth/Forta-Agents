import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import agent, { web3, killme } from "./killme";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  const createTxEvent = (signature: string) =>
    createTransactionEvent({
      transaction: { data: signature } as any,
      addresses: { "0xDeBF20617708857ebe4F679508E7b7863a8A8EeE": true },
      receipt: {} as any,
      block: {} as any,
    });

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  it("create and send a tx with the tx event", async () => {
    const signature = web3.eth.abi.encodeFunctionCall(killme as any, []);
    const tx = createTxEvent(signature);
    const findings = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Kill Me funciton called",
        description: "Kill Me funciton called on pool",
        alertId: "NETHFORTA-24",
        protocol: "ethereum",
        severity: 2,
        type: 2,
        everestId: undefined,
        metadata: {},
      }),
    ]);
  });
});
