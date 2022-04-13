import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import agent from "./agent";
import { MAKER_ESM_FIRE_EVENT_SIGNATURE } from "./fire.event";
import { MAKER_ESM_JOIN_EVENT_SIGNATURE } from "./join.event";
import { encodeParam } from "./utils";

const MakerDAO_ESM_CONTRACT = "0x29cfbd381043d00a98fd9904a431015fef07af2f";
const JOIN_EVENT_ALERTID = "MakerDAO-ESM-1";
const FIRE_EVENT_ALERTID = "MakerDAO-ESM-2";

const AMOUNT_3 = "3000000000000000000"; // 3
const AMOUNT_1 = "1000000000000000000"; // 1
const USER = createAddress("0x2");

describe("Agent Handler", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.provideAgentHandler();
  });

  it("should return Fire event finding", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(MAKER_ESM_FIRE_EVENT_SIGNATURE, MakerDAO_ESM_CONTRACT)
      .setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Maker ESM Fire Event",
        description: "Fire event emitted.",
        alertId: FIRE_EVENT_ALERTID,
        severity: FindingSeverity.Critical,
        type: FindingType.Suspicious,
        protocol: "Maker",
        metadata: {
          ESM_address: MakerDAO_ESM_CONTRACT,
          from: USER,
        },
      }),
    ]);
  });

  it("should return Join event finding", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      MakerDAO_ESM_CONTRACT,
      encodeParam("uint256", AMOUNT_3), // 3
      encodeParam("address", USER)
    );

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Maker ESM Join Event",
        description: "Greater than 2 MKR is sent to ESM contract.",
        alertId: JOIN_EVENT_ALERTID,
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

  it("should return both Join and Fire event finding", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        MAKER_ESM_JOIN_EVENT_SIGNATURE,
        MakerDAO_ESM_CONTRACT,
        encodeParam("uint256", AMOUNT_3), // 3
        encodeParam("address", USER)
      )
      .addEventLog(MAKER_ESM_FIRE_EVENT_SIGNATURE, MakerDAO_ESM_CONTRACT)
      .setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Maker ESM Join Event",
        description: "Greater than 2 MKR is sent to ESM contract.",
        alertId: JOIN_EVENT_ALERTID,
        protocol: "Maker",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          usr: USER,
          amount: AMOUNT_3,
        },
      }),
      Finding.fromObject({
        name: "Maker ESM Fire Event",
        description: "Fire event emitted.",
        alertId: FIRE_EVENT_ALERTID,
        severity: FindingSeverity.Critical,
        type: FindingType.Suspicious,
        protocol: "Maker",
        metadata: {
          ESM_address: MakerDAO_ESM_CONTRACT,
          from: USER,
        },
      }),
    ]);
  });

  it("should return just Join event finding", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        MAKER_ESM_JOIN_EVENT_SIGNATURE,
        MakerDAO_ESM_CONTRACT,
        encodeParam("uint256", AMOUNT_3), // 3
        encodeParam("address", USER)
      )
      .addEventLog("BAD SIGNATURE", MakerDAO_ESM_CONTRACT)
      .setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Maker ESM Join Event",
        description: "Greater than 2 MKR is sent to ESM contract.",
        alertId: JOIN_EVENT_ALERTID,
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

  it("should return just Fire event finding", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        MAKER_ESM_JOIN_EVENT_SIGNATURE,
        MakerDAO_ESM_CONTRACT,
        encodeParam("uint256", AMOUNT_1),
        encodeParam("address", USER)
      )
      .addEventLog(MAKER_ESM_FIRE_EVENT_SIGNATURE, MakerDAO_ESM_CONTRACT)
      .setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Maker ESM Fire Event",
        description: "Fire event emitted.",
        alertId: FIRE_EVENT_ALERTID,
        severity: FindingSeverity.Critical,
        type: FindingType.Suspicious,
        protocol: "Maker",
        metadata: {
          ESM_address: MakerDAO_ESM_CONTRACT,
          from: USER,
        },
      }),
    ]);
  });
  it("should return empty finding if address is wrong", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        MAKER_ESM_JOIN_EVENT_SIGNATURE,
        "0x1", // bad address
        encodeParam("uint256", AMOUNT_1),
        encodeParam("address", USER)
      )
      .addEventLog(MAKER_ESM_FIRE_EVENT_SIGNATURE, "0x1")
      .setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty finding if signature is wrong", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        "0xabc", // bad signature
        MakerDAO_ESM_CONTRACT,
        encodeParam("uint256", AMOUNT_1),
        encodeParam("address", USER)
      )
      .addEventLog("0xabc", MakerDAO_ESM_CONTRACT)
      .setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
