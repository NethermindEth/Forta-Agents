import {
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import providesetKilledAgent, {
  web3,
  setKilled,
} from "../agents/Curve-dao-KillingGauge";

const ADDRESS = "0x1111";
const ALERTID = "NETHFORTA-21-6";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = providesetKilledAgent(ALERTID, ADDRESS);
  });

  const createTxEvent = (signature: string) =>
    createTransactionEvent({
      transaction: { data: signature } as any,
      addresses: { ADDRESS: true },
      receipt: {} as any,
      block: {} as any,
    });

  it("create and send a tx with the tx event", async () => {
    const signature = web3.eth.abi.encodeFunctionCall(setKilled as any, [
      "true",
    ]);
    const tx = createTxEvent(signature);
    const findings = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Set Killed funciton called",
        description: "Set Killed funciton called on pool",
        alertId: ALERTID,
        protocol: "ethereum",
        severity: 2,
        type: 2,
        everestId: undefined,
        metadata: {},
      }),
    ]);
  });
});
