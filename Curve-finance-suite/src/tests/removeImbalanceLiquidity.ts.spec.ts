import { Finding, HandleTransaction } from "forta-agent";
import provideRemoveLiquidityImbalanceAgent, {
  REMOVE_LIQUIDITY_IMBALANCE_SIGNATURE,
} from "../agents/removeImbalanceLiquidity";

import createTxEventWithLog from "../utils/createEventLog";

const ADDRESS = "0x1111";
const ALERTID = "test";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideRemoveLiquidityImbalanceAgent(ALERTID, ADDRESS);
  });

  it("create and send a tx with the tx event", async () => {
    const txEvent = createTxEventWithLog(
      REMOVE_LIQUIDITY_IMBALANCE_SIGNATURE,
      ADDRESS
    );
    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "RemoveLiquidityImbalance funciton called",
        description: "RemoveLiquidityImbalance funciton called on pool",
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
