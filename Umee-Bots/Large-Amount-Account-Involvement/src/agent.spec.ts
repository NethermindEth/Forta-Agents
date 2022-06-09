import { FindingType, FindingSeverity, Finding, HandleTransaction } from "forta-agent";
import { TestTransactionEvent, createAddress } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { AgentConfig } from "./agent.config";

const CONFIG: AgentConfig = {
  threshold: 5,
  monitoredAddresses: [createAddress("0x111"), createAddress("0x222"), createAddress("0x333")],
};

const testAddresses: string[] = [
  createAddress("0xa1"),
  createAddress("0xa2"),
  createAddress("0xa3"),
  createAddress("0xa4"),
  createAddress("0xa5"),
];

const createFinding = (from: string, to: string | null, address: string, amount: number) => {
  return Finding.from({
    alertId: "UMEE-13",
    name: "Large amount of account involvement",
    description: "Transaction includes large amount of addresses",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Umee",
    metadata: {
      from,
      to: to || "",
      monitoredAddress: address,
      amountOfInvolvedAddresses: amount.toString(),
    },
  });
};

describe("Detect transaction involving large amount of addresses", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(CONFIG);
  });

  it("returns empty findings when there is not any transaction addresses involved besides 'from address'", async () => {
    const tx = new TestTransactionEvent();

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings when there are a large number of transaction addresses not involved with monitored addresses", async () => {
    const tx = new TestTransactionEvent().addInvolvedAddresses(
      createAddress("0x444"),
      createAddress("0x555"),
      ...testAddresses
    );

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it("returns empty findings when there are not a large number of transaction addresses involved with monitored addresses", async () => {
    const tx = new TestTransactionEvent().addInvolvedAddresses(
      CONFIG.monitoredAddresses[0],
      CONFIG.monitoredAddresses[1],
      createAddress("0x666"),
      createAddress("0x777")
    );

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([]);
  });

  it("returns a finding when there are a large number of transaction addresses involved with a monitored address", async () => {
    const tx = new TestTransactionEvent().addInvolvedAddresses(CONFIG.monitoredAddresses[0], ...testAddresses);

    const amountOfInvolvedAddresses = Object.keys(tx.addresses).length;

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([
      createFinding(tx.transaction.from, tx.transaction.to, CONFIG.monitoredAddresses[0], amountOfInvolvedAddresses),
    ]);
  });

  it("returns two findings when there are a large number of transaction addresses involved with two monitored addresses in the same transaction", async () => {
    const tx = new TestTransactionEvent().addInvolvedAddresses(
      CONFIG.monitoredAddresses[0],
      CONFIG.monitoredAddresses[1],
      ...testAddresses
    );

    const amountOfInvolvedAddresses = Object.keys(tx.addresses).length;

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([
      createFinding(tx.transaction.from, tx.transaction.to, CONFIG.monitoredAddresses[0], amountOfInvolvedAddresses),
      createFinding(tx.transaction.from, tx.transaction.to, CONFIG.monitoredAddresses[1], amountOfInvolvedAddresses),
    ]);
  });

  it("returns multiple findings when there are a large number of transaction addresses involved with multiple monitored addresses in the same transaction", async () => {
    const tx = new TestTransactionEvent().addInvolvedAddresses(
      CONFIG.monitoredAddresses[0],
      CONFIG.monitoredAddresses[2],
      createAddress("0x444"),
      createAddress("0x555"),
      ...testAddresses
    );

    const amountOfInvolvedAddresses = Object.keys(tx.addresses).length;

    const findings = await handleTransaction(tx);

    expect(findings).toStrictEqual([
      createFinding(tx.transaction.from, tx.transaction.to, CONFIG.monitoredAddresses[0], amountOfInvolvedAddresses),
      createFinding(tx.transaction.from, tx.transaction.to, CONFIG.monitoredAddresses[2], amountOfInvolvedAddresses),
    ]);
  });
});
