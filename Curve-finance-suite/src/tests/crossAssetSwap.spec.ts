import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from "forta-agent";
import provideCrossAssetSwap, {
  CROSSCHAINSWAPSIGNATURE,
} from "../agents/crossAssetSwap";
import createTxEventWithLog from "../utils/createEventLog";

const ADDRESS = "0x1212";
const ALERT_ID = "test";

describe("high gas agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideCrossAssetSwap(ALERT_ID, ADDRESS);
  });

  it("create and send a tx with the tx event", async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      CROSSCHAINSWAPSIGNATURE,
      ADDRESS
    );
    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "CrossChainSwap funciton called",
        description: "CrossChainSwap funciton called on pool",
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
