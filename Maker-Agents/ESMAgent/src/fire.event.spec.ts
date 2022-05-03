import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import provideESMFireEventAgent, { MAKER_ESM_FIRE_EVENT_SIGNATURE } from "./fire.event";

const ESM_ADDRESS = createAddress("0x1");
const USER = createAddress("0x2");
const ALERT_ID = "testID";

describe("ESM Fire Event Agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    const mockFetcher: any = {
      esmAddress: ESM_ADDRESS,
      getEsmAddress: jest.fn(),
    };
    handleTransaction = provideESMFireEventAgent(ALERT_ID, mockFetcher);
  });

  it("should return a finding", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(MAKER_ESM_FIRE_EVENT_SIGNATURE, ESM_ADDRESS)
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
          ESM_address: ESM_ADDRESS,
          from: USER,
        },
      }),
    ]);
  });

  it("should return an empty finding because of a bad address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(MAKER_ESM_FIRE_EVENT_SIGNATURE, "ox222")
      .setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding because of a bad signature", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog("bad sig", ESM_ADDRESS).setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding because of a bad signature and a bad address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog("bad sig", "0x222").setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
