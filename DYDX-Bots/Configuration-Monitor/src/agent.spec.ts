import { formatBytes32String, Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { MONITORED_EVENTS, provideHandleTransaction } from "./agent";

// Function to create test findings.
const createFinding = (name: string, configHash: string) => {
  const description =
    name === "LogGlobalConfigurationRegistered"
      ? "registered"
      : "LogGlobalConfigurationApplied"
      ? "applied"
      : "removed";

  const alertId =
    name === "LogGlobalConfigurationRegistered"
      ? "DYDX-3-1"
      : "LogGlobalConfigurationApplied"
      ? "DYDX-3-2"
      : "DYDX-3-3";

  return Finding.fromObject({
    name: `A global configuration hash has been ${description}`,
    description: `${name} event emitted on perpetual contract`,
    alertId: alertId,
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "DYDX",
    metadata: {
      configHash: configHash,
    },
  });
};

describe("Global configuration monitor tests suite", () => {
  const perpetual = createAddress("0x1");
  const PERPETUAL_IFACE = new Interface(MONITORED_EVENTS);

  const mockProvider = {
    getAddress: () => perpetual,
  };

  const handler: HandleTransaction = provideHandleTransaction(mockProvider as any);

  it("should ignore empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore events from other contracts", async () => {
    const log1 = PERPETUAL_IFACE.encodeEventLog(PERPETUAL_IFACE.getEvent("LogGlobalConfigurationRegistered"), [
      formatBytes32String("config1"),
    ]);
    const log2 = PERPETUAL_IFACE.encodeEventLog(PERPETUAL_IFACE.getEvent("LogGlobalConfigurationApplied"), [
      formatBytes32String("config2"),
    ]);
    const log3 = PERPETUAL_IFACE.encodeEventLog(PERPETUAL_IFACE.getEvent("LogGlobalConfigurationRemoved"), [
      formatBytes32String("config3"),
    ]);

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
      )
      .addAnonymousEventLog(
        // Different contract address
        createAddress("0xa1"),
        log3.data,
        ...log3.topics
      );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other events on pereptual contract", async () => {
    const DIFFERENT_IFACE = new Interface(["event otherEvent()"]);

    const log1 = DIFFERENT_IFACE.encodeEventLog(DIFFERENT_IFACE.getEvent("otherEvent"), []);

    const tx: TransactionEvent = new TestTransactionEvent().addAnonymousEventLog(
      // perpetual contract address
      perpetual,
      log1.data,
      ...log1.topics
    );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect monitored events on perpetual contract", async () => {
    const log1 = PERPETUAL_IFACE.encodeEventLog(PERPETUAL_IFACE.getEvent("LogGlobalConfigurationRegistered"), [
      formatBytes32String("config1"),
    ]);
    const log2 = PERPETUAL_IFACE.encodeEventLog(PERPETUAL_IFACE.getEvent("LogGlobalConfigurationApplied"), [
      formatBytes32String("config2"),
    ]);
    const log3 = PERPETUAL_IFACE.encodeEventLog(PERPETUAL_IFACE.getEvent("LogGlobalConfigurationRemoved"), [
      formatBytes32String("config3"),
    ]);
    const log4 = PERPETUAL_IFACE.encodeEventLog(PERPETUAL_IFACE.getEvent("LogGlobalConfigurationRegistered"), [
      formatBytes32String("config4"),
    ]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(perpetual, log1.data, ...log1.topics)
      .addAnonymousEventLog(perpetual, log2.data, ...log2.topics)
      .addAnonymousEventLog(perpetual, log3.data, ...log3.topics)
      .addAnonymousEventLog(perpetual, log4.data, ...log4.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding("LogGlobalConfigurationRegistered", formatBytes32String("config1")),
      createFinding("LogGlobalConfigurationApplied", formatBytes32String("config2")),
      createFinding("LogGlobalConfigurationRemoved", formatBytes32String("config3")),
      createFinding("LogGlobalConfigurationRegistered", formatBytes32String("config4")),
    ]);
  });
});
