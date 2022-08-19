import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { DISPUTE_EVENT } from "./constants";
import agent, { provideHandleTransaction } from "./agent";
import { getFindingInstance } from "./helpers";
import { createAddress, NetworkManager } from "forta-agent-tools";
import { NetworkDataInterface } from "./network";

const RANDOM_ADDRESS = createAddress("0x12");

const TEST_HUBPOOL_ADDR: string = createAddress("0x23");
const NM_DATA: Record<number, NetworkDataInterface> = {
  0: { hubPoolAddr: TEST_HUBPOOL_ADDR },
};

// @Review probably can change HUBPOOL addr to a temp address
const networkManagerTest = new NetworkManager(NM_DATA, 0);

describe("Root Bundle Disputed agent", () => {
  let handleTransaction: HandleTransaction = provideHandleTransaction(DISPUTE_EVENT, networkManagerTest);

  it("returns empty findings if there is no dispute", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().setFrom(TEST_HUBPOOL_ADDR);
    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("doesn't return a finding if there a dispute is made from the wrong address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(RANDOM_ADDRESS)
      .addEventLog(DISPUTE_EVENT, RANDOM_ADDRESS, [RANDOM_ADDRESS, "0x123"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if there a dispute is made on a relevant contract address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(TEST_HUBPOOL_ADDR)
      .addEventLog(DISPUTE_EVENT, TEST_HUBPOOL_ADDR, [RANDOM_ADDRESS, "0x123"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([getFindingInstance(RANDOM_ADDRESS, "291")]);
  });
});
