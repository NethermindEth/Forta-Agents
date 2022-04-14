import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import provideESMFireEventAgent, { MAKER_ESM_FIRE_EVENT_SIGNATURE } from "./fire.event";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";

const ADDRESS = createAddress("0x1");
const USER = createAddress("0x2");
const ALERT_ID = "testID";

describe("ESM Fire Event Agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideESMFireEventAgent(ALERT_ID, ADDRESS);
  });

  it("should return a finding", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(MAKER_ESM_FIRE_EVENT_SIGNATURE, ADDRESS)
      .setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Maker ESM Fire Event",
        description: "Fire event emitted.",
        alertId: ALERT_ID,
        severity: FindingSeverity.Critical,
        type: FindingType.Suspicious,
        protocol: "Maker",
        metadata: {
          ESM_address: ADDRESS,
          from: USER,
        },
      }),
    ]);
  });

  it("should return empty finding cause bad ADDRESS", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(MAKER_ESM_FIRE_EVENT_SIGNATURE, "ox222")
      .setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty finding cause bad SIGNATURE", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog("bad sig", ADDRESS).setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty finding cause bad SIGNATURE and bad ADDRESS", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog("bad sig", "0x222").setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
