import { HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { FILLED_RELAY_EVENT, getFindingInstance } from "./utils";
import { provideHandleTransaction } from "./agent";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { NetworkDataInterface } from "./network";

const TEST_MONITORED_ADDRESSES = [createAddress("0x59"), createAddress("0x75")];
const RANDOM_ADDRESSES = [createAddress("0x12"), createAddress("0x54"), createAddress("0x43")];
const RANDOM_EVENT_ABI = "event Transfer(address,uint)";
const TEST_SPOKEPOOL_ADDR: string = createAddress("0x23");
const MOCK_NM_DATA: Record<number, NetworkDataInterface> = {
  0: {
    spokePoolAddr: TEST_SPOKEPOOL_ADDR,
    monitoredList: TEST_MONITORED_ADDRESSES,
  },
};
const networkManagerTest = new NetworkManager(MOCK_NM_DATA, 0);
const passParams = (_monitoredAddress:string) => {
  return [
    "120",
    "100",
    "100",
    "42161",
    "1",
    "1",
    "2",
    "2",
    "2",
    "3215",
    RANDOM_ADDRESSES[0],
    RANDOM_ADDRESSES[1],
    _monitoredAddress,
    RANDOM_ADDRESSES[2],
    false,
  ];
};

const expectedFinding = (_depositor:string) => { return getFindingInstance("120", "1", "1", _depositor, RANDOM_ADDRESSES[2], "false");}

describe("Monitored Wallet Usage detection bot test suite", () => {
  let handleTransaction: HandleTransaction = provideHandleTransaction(FILLED_RELAY_EVENT, networkManagerTest);

  it("returns empty findings if there is no event emitted", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a monitored wallet usage is detected on a contract address other than the SpokePool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(FILLED_RELAY_EVENT, RANDOM_ADDRESSES[0], passParams(TEST_MONITORED_ADDRESSES[0]));

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if a monitored address uses the SpokePool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(FILLED_RELAY_EVENT, TEST_SPOKEPOOL_ADDR, passParams(TEST_MONITORED_ADDRESSES[0]));

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([expectedFinding(TEST_MONITORED_ADDRESSES[0])]);
  });

  it("doesn't return a finding if an irrelevant event is emitted from the SpokePool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(RANDOM_EVENT_ABI, TEST_SPOKEPOOL_ADDR, [RANDOM_ADDRESSES[0], "120"]);
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a non-monitored address uses the SpokePool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(FILLED_RELAY_EVENT, TEST_SPOKEPOOL_ADDR, passParams(RANDOM_ADDRESSES[0]));
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns N findings when the same monitored wallet uses the SpokePool N times for bridging funds (N>=1)", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(FILLED_RELAY_EVENT, TEST_SPOKEPOOL_ADDR, passParams(TEST_MONITORED_ADDRESSES[0]))
      .addEventLog(FILLED_RELAY_EVENT, TEST_SPOKEPOOL_ADDR, passParams(TEST_MONITORED_ADDRESSES[0]))
      .addEventLog(RANDOM_EVENT_ABI, TEST_SPOKEPOOL_ADDR, [RANDOM_ADDRESSES[0], "120"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([expectedFinding(TEST_MONITORED_ADDRESSES[0]), expectedFinding(TEST_MONITORED_ADDRESSES[0])]);
  });

  it("returns N findings when different monitored addresses use the SpokePool N times for bridging funds (N>=1)", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(FILLED_RELAY_EVENT, TEST_SPOKEPOOL_ADDR, passParams(TEST_MONITORED_ADDRESSES[0]))
      .addEventLog(FILLED_RELAY_EVENT, TEST_SPOKEPOOL_ADDR, passParams(TEST_MONITORED_ADDRESSES[1]))
      .addEventLog(RANDOM_EVENT_ABI, TEST_SPOKEPOOL_ADDR, [RANDOM_ADDRESSES[0], "120"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([expectedFinding(TEST_MONITORED_ADDRESSES[0]), expectedFinding(TEST_MONITORED_ADDRESSES[1])]);
  });
});
