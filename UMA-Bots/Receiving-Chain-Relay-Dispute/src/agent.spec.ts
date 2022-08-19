import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { DISPUTE_EVENT, HUBPOOL_ADDRESS } from "./constants";
import agent from "./agent";
import { getFindingInstance } from "./helpers";

const RANDOM_ADDRESS = "0x0000000000000000000000000000000000000012";

describe("Root Bundle Disputed agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  it("returns empty findings if there is no dispute", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent().setFrom(HUBPOOL_ADDRESS);
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
      .setFrom(HUBPOOL_ADDRESS)
      .addEventLog(DISPUTE_EVENT, HUBPOOL_ADDRESS, [RANDOM_ADDRESS, "0x123"]);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([getFindingInstance(RANDOM_ADDRESS, "291")]);
  });
});
