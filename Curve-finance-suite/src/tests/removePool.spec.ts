import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from "forta-agent";
import provideRemovePoolAgent, {
  REMOVE_POOL_SIGNATURE,
} from "../agents/removePool";

import createTxEventWithLog from "../utils/createEventLog";

const ADDRESS = "0X1111";
const ALERT_ID = "test";

describe("Add Pool agent", () => {
  let handleTransactions: HandleTransaction;

  beforeAll(() => {
    handleTransactions = provideRemovePoolAgent(ALERT_ID, ADDRESS);
  });

  it("should create a findings", async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      REMOVE_POOL_SIGNATURE,
      ADDRESS
    );

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Remove Pool",
        description: "Pool Removed",
        alertId: ALERT_ID,
        severity: FindingSeverity.Info,
        type: FindingType.Unknown,
      }),
    ]);
  });

  it("should return empty finding", async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(
      "Wrong Signature",
      "0x123"
    );

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
