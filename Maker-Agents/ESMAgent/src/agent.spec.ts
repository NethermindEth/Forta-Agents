import { createAddress, TestTransactionEvent, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { Finding, Initialize, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import { encodeParameter } from "forta-agent-tools";
import { utils } from "ethers";
import agent from "./agent";
import { MAKER_ESM_FIRE_EVENT_SIGNATURE } from "./fire.event";
import { MAKER_ESM_JOIN_EVENT_SIGNATURE } from "./join.event";

const MakerDAO_CHANGELOG_ADDRESS = createAddress("0xab");
const MakerDAO_CHANGELOG_IFACE = new utils.Interface([
  "function getAddress(bytes32 _key) public view returns (address addr)",
]);
const ESM_BYTES = "0xdeadBeef00000000000000000000000000000000000000000000000000000000";
const MakerDAO_ESM_CONTRACT = createAddress("0xac");
const JOIN_EVENT_ALERTID = "MakerDAO-ESM-1";
const FIRE_EVENT_ALERTID = "MakerDAO-ESM-2";

const AMOUNT_3 = "3000000000000000000"; // 3
const AMOUNT_1 = "1000000000000000000"; // 1
const USER = createAddress("0x2");

describe("Agent Handler", () => {
  let handleTransaction: HandleTransaction;
  let initialize: Initialize;
  const mockProvider: MockEthersProvider = new MockEthersProvider().addCallTo(
    MakerDAO_CHANGELOG_ADDRESS,
    1,
    MakerDAO_CHANGELOG_IFACE,
    "getAddress",
    { inputs: [ESM_BYTES], outputs: [MakerDAO_ESM_CONTRACT] }
  );

  beforeAll(() => {
    initialize = agent.provideInitialize(MakerDAO_CHANGELOG_ADDRESS, ESM_BYTES, mockProvider as any);
    handleTransaction = agent.provideAgentHandler();
  });

  it("should return Fire event finding", async () => {
    initialize();

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
    initialize();

    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(
      MAKER_ESM_JOIN_EVENT_SIGNATURE,
      MakerDAO_ESM_CONTRACT,
      encodeParameter("uint256", AMOUNT_3), // 3
      encodeParameter("address", USER)
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

  it("should return both Join and Fire event findings", async () => {
    initialize();

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        MAKER_ESM_JOIN_EVENT_SIGNATURE,
        MakerDAO_ESM_CONTRACT,
        encodeParameter("uint256", AMOUNT_3), // 3
        encodeParameter("address", USER)
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
    initialize();

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        MAKER_ESM_JOIN_EVENT_SIGNATURE,
        MakerDAO_ESM_CONTRACT,
        encodeParameter("uint256", AMOUNT_3), // 3
        encodeParameter("address", USER)
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
    initialize();

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        MAKER_ESM_JOIN_EVENT_SIGNATURE,
        MakerDAO_ESM_CONTRACT,
        encodeParameter("uint256", AMOUNT_1),
        encodeParameter("address", USER)
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
    initialize();

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        MAKER_ESM_JOIN_EVENT_SIGNATURE,
        "0x1", // bad address
        encodeParameter("uint256", AMOUNT_1),
        encodeParameter("address", USER)
      )
      .addEventLog(MAKER_ESM_FIRE_EVENT_SIGNATURE, "0x1")
      .setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty finding if signature is wrong", async () => {
    initialize();

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addEventLog(
        "0xabc", // bad signature
        MakerDAO_ESM_CONTRACT,
        encodeParameter("uint256", AMOUNT_1),
        encodeParameter("address", USER)
      )
      .addEventLog("0xabc", MakerDAO_ESM_CONTRACT)
      .setFrom(USER);

    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
