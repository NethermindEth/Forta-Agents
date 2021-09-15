import {
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import providesetRewardsAgent, {
  web3,
  setRewards,
} from "../agents/Curve-Gauge-SetRewards";

const ADDRESS = "0x1111";
const PAYOUTADDRESS = "0x5C34E725CcA657F02C1D81fb16142F6F0067689b";
const ALERTID = "NETHFORTA-21-7";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = providesetRewardsAgent(ALERTID, ADDRESS);
  });

  const createTxEvent = (signature: string) =>
    createTransactionEvent({
      transaction: { data: signature } as any,
      addresses: { ADDRESS: true },
      receipt: {} as any,
      block: {} as any,
    });

  it("create and send a tx with the tx event", async () => {
    const signature = web3.eth.abi.encodeFunctionCall(setRewards as any, [
      PAYOUTADDRESS,
      "0x",
      [...Array(8)].map(
        (_, i) => "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
      ) as any,
    ]);
    const tx = createTxEvent(signature);
    const findings = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Set Rewards funciton called",
        description: "Set Rewards funciton called on pool",
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
