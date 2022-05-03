import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import { encodeParameter } from "forta-agent-tools";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";
import provideESMJoinEventAgent, { MAKER_ESM_JOIN_EVENT_SIGNATURE } from "./join.event";

const ESM_ADDRESS = createAddress("0x1");
const USER = createAddress("0x2");
const ALERT_ID = "testID";

const AMOUNT_3 = "3000000000000000000"; // 3
const AMOUNT_1 = "1000000000000000000"; // 1

describe("ESM Join Event Agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    const mockFetcher: any = {
      esmAddress: ESM_ADDRESS,
      getEsmAddress: jest.fn(),
    };
    handleTransaction = provideESMJoinEventAgent(ALERT_ID, mockFetcher);
  });

  it("should return a finding if condition is met", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      ESM_ADDRESS,
      encodeParameter("uint256", AMOUNT_3), // 3
      encodeParameter("address", USER)
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Maker ESM Join Event",
        description: "Greater than 2 MKR is sent to ESM contract.",
        alertId: ALERT_ID,
        protocol: "Maker",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          usr: USER,
          amount: AMOUNT_3,
        },
      }),
    ]);
  });

  it("should return an empty finding if MKR condition is not met", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      ESM_ADDRESS,
      encodeParameter("uint256", AMOUNT_1), //1
      encodeParameter("address", USER)
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding because of bad signature", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      "bad sig",
      ESM_ADDRESS,
      encodeParameter("uint256", AMOUNT_3), // 3
      encodeParameter("address", USER)
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding because of bad address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      "0x1",
      encodeParameter("uint256", AMOUNT_1), // 3
      encodeParameter("address", USER)
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding because of bad signature and a bad address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      "bad sig",
      "0x1",
      encodeParameter("uint256", AMOUNT_1), // 3
      encodeParameter("address", USER)
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
