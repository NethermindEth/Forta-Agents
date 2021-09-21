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
const ALERTID = "NETHFORTA-21-8";
const REWARDADDRESS = "0xfbc61be3798ac4043eaa31f6224b9a46e8c93e20";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = providesetRewardsAgent(ALERTID, ADDRESS);
  });

  const createTxEvent = (signature: string) =>
    createTransactionEvent({
      transaction: { data: signature } as any,
      addresses: { "0x1111": true },
      receipt: {} as any,
      block: {} as any,
    });

  it("create and send a tx with the tx event", async () => {
    const signature = web3.eth.abi.encodeFunctionCall(setRewards as any, [
      REWARDADDRESS,
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
