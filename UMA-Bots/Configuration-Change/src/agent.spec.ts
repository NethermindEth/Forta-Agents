import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { DISPUTE_EVENT } from "./constants";
import agent, { provideHandleTransaction } from "./agent";
import { getFindingInstance } from "./helpers";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { NetworkDataInterface } from "./network";

const RANDOM_HEX_ARR = ["0x123", "0x42"];
const RANDOM_HEX_ARR_DECIMAL = ["291", "66"];

const RANDOM_ADDRESSES = [createAddress("0x12"), createAddress("0x54")];
const RANDOM_EVENT_ABI = "event Transfer(address,uint)";
const TEST_HUBPOOL_ADDR: string = createAddress("0x23");
const NM_DATA: Record<number, NetworkDataInterface> = {
  0: { hubPoolAddr: TEST_HUBPOOL_ADDR },
};

const networkManagerTest = new NetworkManager(NM_DATA, 0);

describe("Root Bundle Disputed bot", () => {
  let handleTransaction: HandleTransaction = provideHandleTransaction(DISPUTE_EVENT, networkManagerTest);

  it("returns empty findings if there is no dispute", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().setFrom(TEST_HUBPOOL_ADDR);
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if there a dispute is made from the wrong address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESSES[0])
      .addEventLog(DISPUTE_EVENT, RANDOM_ADDRESSES[0], [RANDOM_ADDRESSES[0], RANDOM_HEX_ARR[0]]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if there a dispute is made on a relevant contract address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(DISPUTE_EVENT, TEST_HUBPOOL_ADDR, [RANDOM_ADDRESSES[0], RANDOM_HEX_ARR[0]]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([getFindingInstance(RANDOM_ADDRESSES[0], RANDOM_HEX_ARR_DECIMAL[0])]);
  });

  it("doesn't return a finding if there a non-dispute event is emitted from the HubPool", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(RANDOM_EVENT_ABI, TEST_HUBPOOL_ADDR, [RANDOM_ADDRESSES[0], RANDOM_HEX_ARR[0]]);
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns N findings for N events (N>=1)", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(DISPUTE_EVENT, TEST_HUBPOOL_ADDR, [RANDOM_ADDRESSES[0], RANDOM_HEX_ARR[0]])
      .addEventLog(DISPUTE_EVENT, TEST_HUBPOOL_ADDR, [RANDOM_ADDRESSES[1], RANDOM_HEX_ARR[1]]);
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      getFindingInstance(RANDOM_ADDRESSES[0], RANDOM_HEX_ARR_DECIMAL[0]),
      getFindingInstance(RANDOM_ADDRESSES[1], RANDOM_HEX_ARR_DECIMAL[1]),
    ]);
  });
});
