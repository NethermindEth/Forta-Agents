import { Interface } from "ethers/lib/utils";
import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import {
  createAddress,
  TestTransactionEvent,
} from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { MONITORED_EVENTS } from "./agent";

// function to generate test findings
const createFinding = (name: string, operator: string) => {
  const description = name === "LogOperatorAdded" ? "added to" : "removed from";
  const alertId = name === "LogOperatorAdded" ? "DYDX-4-1" : "DYDX-4-2";

  return Finding.fromObject({
    name: `An operator has been ${description} dydx perpetual exchange.`,
    description: `${name} event emitted on perpetual contract`,
    alertId: alertId,
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "DYDX",
    metadata: {
      operator: operator.toLowerCase(),
    },
  });
};

describe("Operator monitor tests suite", () => {
  const perpetual = createAddress("0x1");
  const PERPETUAL_IFACE = new Interface(MONITORED_EVENTS);

  const handler: HandleTransaction = provideHandleTransaction(perpetual);

  it("should ignore empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore LogOperatorAdded, LogOperatorRemoved events from other contracts", async () => {
    const log1 = PERPETUAL_IFACE.encodeEventLog(
      PERPETUAL_IFACE.getEvent("LogOperatorAdded"),
      [createAddress("0xf0")]
    );
    const log2 = PERPETUAL_IFACE.encodeEventLog(
      PERPETUAL_IFACE.getEvent("LogOperatorRemoved"),
      [createAddress("0xf0")]
    );

    const tx: TransactionEvent = new TestTransactionEvent()
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

  it("should ignore other events on pereptual contract", async () => {
    const DIFFERENT_IFACE = new Interface(["event otherEvent()"]);

    const log1 = DIFFERENT_IFACE.encodeEventLog(
      DIFFERENT_IFACE.getEvent("otherEvent"),
      []
    );

    const tx: TransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(
        // perpetual contract address
        perpetual,
        log1.data,
        ...log1.topics
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect LogOperatorAdded events on perpetual contract", async () => {
    const log1 = PERPETUAL_IFACE.encodeEventLog(
      PERPETUAL_IFACE.getEvent("LogOperatorAdded"),
      [createAddress("0xf1")]
    );

    const tx: TransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(
        perpetual,
        log1.data,
        ...log1.topics
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding("LogOperatorAdded", createAddress("0xf1")),
    ]);
  });

  it("should detect LogOperatorRemoved events on perpetual contract", async () => {
    const log1 = PERPETUAL_IFACE.encodeEventLog(
      PERPETUAL_IFACE.getEvent("LogOperatorRemoved"),
      [createAddress("0xf2")]
    );

    const tx: TransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(
        perpetual,
        log1.data,
        ...log1.topics
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding("LogOperatorRemoved", createAddress("0xf2")),
    ]);
  });

  it("should detect multiple events on perpetual contract", async () => {
    const log1 = PERPETUAL_IFACE.encodeEventLog(
      PERPETUAL_IFACE.getEvent("LogOperatorAdded"),
      [createAddress("0xf3")]
    );

    const log2 = PERPETUAL_IFACE.encodeEventLog(
      PERPETUAL_IFACE.getEvent("LogOperatorRemoved"),
      [createAddress("0xf4")]
    );
    const log3 = PERPETUAL_IFACE.encodeEventLog(
      PERPETUAL_IFACE.getEvent("LogOperatorRemoved"),
      [createAddress("0xf5")]
    );
    const log4 = PERPETUAL_IFACE.encodeEventLog(
      PERPETUAL_IFACE.getEvent("LogOperatorAdded"),
      [createAddress("0xf6")]
    );

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(perpetual, log1.data, ...log1.topics)
      .addAnonymousEventLog(perpetual, log2.data, ...log2.topics)
      .addAnonymousEventLog(perpetual, log3.data, ...log3.topics)
      .addAnonymousEventLog(perpetual, log4.data, ...log4.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding("LogOperatorAdded", createAddress("0xf3")),
      createFinding("LogOperatorRemoved", createAddress("0xf4")),
      createFinding("LogOperatorRemoved", createAddress("0xf5")),
      createFinding("LogOperatorAdded", createAddress("0xf6")),
    ]);
  });
});
