import { HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { FILLED_RELAY_EVENT, getFindingInstance } from "./utils";
import { provideHandleTransaction } from "./agent";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { NetworkDataInterface } from "./network";

const RANDOM_ADDRESSES = [
  createAddress("0x12"),
  createAddress("0x54"),
  createAddress("0x43"),
  createAddress("0x29"),
];
const TEST_MONITORED_ADDRESS = createAddress("0x59");
const RANDOM_EVENT_ABI = "event Transfer(address,uint)";
const TEST_HUBPOOL_ADDR: string = createAddress("0x23");
const MOCK_NM_DATA: Record<number, NetworkDataInterface> = {
  0: {
    hubPoolAddr: TEST_HUBPOOL_ADDR,
    monitoredList: [TEST_MONITORED_ADDRESS],
  },
};
const networkManagerTest = new NetworkManager(MOCK_NM_DATA, 0);
const passParams = (monitoredAddress: boolean) => {
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
    monitoredAddress ? TEST_MONITORED_ADDRESS : RANDOM_ADDRESSES[2],
    RANDOM_ADDRESSES[3],
    false,
  ];
};

const expectedFinding = getFindingInstance(
  "120",
  "100",
  "100",
  "1",
  "1",
  TEST_MONITORED_ADDRESS,
  RANDOM_ADDRESSES[3],
  "false"
);

describe("Monitored Wallet Usage detection bot", () => {
  let handleTransaction: HandleTransaction = provideHandleTransaction(
    FILLED_RELAY_EVENT,
    networkManagerTest
  );

  it("returns empty findings if there is no even emitted", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a monitored wallet usage is detected on a non-Across contract address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[1])
      .addEventLog(FILLED_RELAY_EVENT, RANDOM_ADDRESSES[0], passParams(true));

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if a monitored address uses the pool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(FILLED_RELAY_EVENT, TEST_HUBPOOL_ADDR, passParams(true));

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([expectedFinding]);
  });

  it("doesn't return a finding if an irrelevant event is emitted from the SpokePool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(RANDOM_EVENT_ABI, TEST_HUBPOOL_ADDR, [
        RANDOM_ADDRESSES[0],
        "120",
      ]);
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if a non-monitored address uses the bridge", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(FILLED_RELAY_EVENT, TEST_HUBPOOL_ADDR, passParams(false));
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns N findings for N events when monitorew wallets transacted (N>=1)", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(FILLED_RELAY_EVENT, TEST_HUBPOOL_ADDR, passParams(true))
      .addEventLog(FILLED_RELAY_EVENT, TEST_HUBPOOL_ADDR, passParams(true))
      .addEventLog(RANDOM_EVENT_ABI, TEST_HUBPOOL_ADDR, [
        RANDOM_ADDRESSES[0],
        "120",
      ]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([expectedFinding, expectedFinding]);
  });
});
