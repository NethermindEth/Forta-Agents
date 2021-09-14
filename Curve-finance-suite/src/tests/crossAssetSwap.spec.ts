import {
  Finding,
  HandleTransaction,
  createTransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import provideCrossAssetSwap, {
  web3,
  CROSSCHAINSWAPSIGNATURE,
} from "../agents/crossAssetSwap";

const ADDRESS = "0x1111";
const ALERT_ID = "test";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideCrossAssetSwap(ALERT_ID, ADDRESS);
  });

  const createTxEvent = (event: any) =>
    createTransactionEvent({
      transaction: {} as any,
      addresses: { ADDRESS: true },
      receipt: { logs: [event] } as any,
      block: {} as any,
    });

  it("create and send a tx with the tx event", async () => {
    const topic = web3.eth.abi.encodeEventSignature(CROSSCHAINSWAPSIGNATURE);
    const event = {
      topics: [topic],
    };
    const tx = createTxEvent(event);
    const findings = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "CrossChainSwap Me funciton called",
        description: "CrossChainSwap Me funciton called on pool",
        alertId: ALERT_ID,
        severity: FindingSeverity.Low,
        type: FindingType.Suspicious,
        metadata: {
          address: ADDRESS,
        },
      }),
    ]);
  });
});
