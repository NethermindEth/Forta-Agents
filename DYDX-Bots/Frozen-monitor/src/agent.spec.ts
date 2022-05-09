import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction, EVENTS_SIGNATURES } from "./agent";

const createFinding = (name: string, from: string) => {
  const description = name === "LogFrozen" ? "Frozen" : "UnFrozen";
  const alertId = name === "LogFrozen" ? "DYDX-2-1" : "DYDX-2-2";

  return Finding.fromObject({
    name: `Perpetual exchange contract is ${description}`,
    description: `${name} event emitted on perpetual contract`,
    alertId: alertId,
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "DYDX",
    metadata: {
      from: from,
    },
  });
};

describe("Frozen state monitor tests suite", () => {
  const perpetual = createAddress("0x1");
  const PERPETUAL_IFACE = new Interface(EVENTS_SIGNATURES);

  const handler: HandleTransaction = provideHandleTransaction(perpetual);

  it("should ignore empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore LogFrozen, LogUnFrozen events from other contracts", async () => {
    const log1 = PERPETUAL_IFACE.encodeEventLog(PERPETUAL_IFACE.getEvent("LogFrozen"), []);
    const log2 = PERPETUAL_IFACE.encodeEventLog(PERPETUAL_IFACE.getEvent("LogUnFrozen"), []);

    const tx: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xb1"))
      .addAnonymousEventLog(
        // Different contract address
        createAddress("0xa1"),
        log1.data,
        ...log1.topics
      )
      .addAnonymousEventLog(
        // Different contract address
        createAddress("0xa1"),
        log2.data,
        ...log2.topics
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other events on perpetual contract", async () => {
    const DIFFERENT_IFACE = new Interface(["event otherEvent()"]);

    const log1 = DIFFERENT_IFACE.encodeEventLog(DIFFERENT_IFACE.getEvent("otherEvent"), []);

    const tx: TransactionEvent = new TestTransactionEvent().setFrom(createAddress("0xb1")).addAnonymousEventLog(
      // perpetual contract address
      perpetual,
      log1.data,
      ...log1.topics
    );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect LogFrozen events on perpetual contract", async () => {
    const log1 = PERPETUAL_IFACE.encodeEventLog(PERPETUAL_IFACE.getEvent("LogFrozen"), []);

    const tx: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xb1"))
      .addAnonymousEventLog(perpetual, log1.data, ...log1.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([createFinding("LogFrozen", createAddress("0xb1"))]);
  });

  it("should detect LogUnFrozen events on perpetual contract", async () => {
    const log1 = PERPETUAL_IFACE.encodeEventLog(PERPETUAL_IFACE.getEvent("LogUnFrozen"), []);

    const tx: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xb2"))
      .addAnonymousEventLog(perpetual, log1.data, ...log1.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([createFinding("LogUnFrozen", createAddress("0xb2"))]);
  });

  it("should detect multiple events on perpetual contract", async () => {
    const log1 = PERPETUAL_IFACE.encodeEventLog(PERPETUAL_IFACE.getEvent("LogFrozen"), []);

    const log2 = PERPETUAL_IFACE.encodeEventLog(PERPETUAL_IFACE.getEvent("LogUnFrozen"), []);

    const tx: TransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xb1"))
      .addAnonymousEventLog(perpetual, log1.data, ...log1.topics)
      .addAnonymousEventLog(perpetual, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding("LogFrozen", createAddress("0xb1")),
      createFinding("LogUnFrozen", createAddress("0xb1")),
    ]);
  });
});
