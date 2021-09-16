import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
  TransactionEvent,
} from "forta-agent";
import provideRemovePoolAgent, { NEWFEE } from "../agents/applyNewFee";

import createTxEventWithLog from "../utils/createEventLog";

const ADDRESS = "0X1111";
const ALERT_ID = "NETHFORTA-21-11";

describe("Add Pool agent", () => {
  let handleTransactions: HandleTransaction;

  beforeAll(() => {
    handleTransactions = provideRemovePoolAgent(ALERT_ID, ADDRESS);
  });

  it("should create a findings", async () => {
    const txEvent: TransactionEvent = createTxEventWithLog(NEWFEE, ADDRESS);

    const findings = await handleTransactions(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "New Fee",
        description: "New Fee Function Called",
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
