import { Interface } from "ethers/lib/utils";
import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";

import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction, SWAP_FACTORY_IFACE } from "./agent";

// Set the alertId to indicate it's a test
const ALERT_ID: string = "swap-factory-pair-created-test";

// Address declarations
const factory: string = createAddress("0xa0");
const token0: string = createAddress("0xb0");
const token1: string = createAddress("0xb1");
const token2: string = createAddress("0xb2");
const token3: string = createAddress("0xb3");
const pair0: string = createAddress("0xc0");
const pair1: string = createAddress("0xc1");

// Returns a finding with given inputs
const createFinding = (token0: string, token1: string, pair: string) =>
  Finding.fromObject({
    name: "New pair created",
    description: "A new pair has been created in Swap Factory V3",
    alertId: ALERT_ID,
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Impossible Finance",
    metadata: {
      token0: token0.toLowerCase(),
      token1: token1.toLowerCase(),
      pair: pair.toLowerCase(),
    },
  });

describe("Swap-Factory-Pair-Created Agent test suite", () => {
  const handler: HandleTransaction = provideHandleTransaction(ALERT_ID, factory);

  it("should ignore empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore same events from other contracts", async () => {
    const log = SWAP_FACTORY_IFACE.encodeEventLog(SWAP_FACTORY_IFACE.getEvent("PairCreated"), [
      token0,
      token1,
      pair0,
      "0",
    ]);

    const tx: TransactionEvent = new TestTransactionEvent().addAnonymousEventLog(
      // Not the factory contract address
      createAddress("0xd4"),
      log.data,
      ...log.topics
    );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore different event from same contract", async () => {
    const IRRELEVANT_IFACE = new Interface(["event IrrelevantEvent(address user)"]);

    const log = SWAP_FACTORY_IFACE.encodeEventLog(IRRELEVANT_IFACE.getEvent("IrrelevantEvent"), [
      createAddress("0xd1"),
    ]);

    const tx: TransactionEvent = new TestTransactionEvent().addAnonymousEventLog(factory, log.data, ...log.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect single event from the contract", async () => {
    const log = SWAP_FACTORY_IFACE.encodeEventLog(SWAP_FACTORY_IFACE.getEvent("PairCreated"), [
      token0,
      token1,
      pair0,
      "0",
    ]);

    const tx: TransactionEvent = new TestTransactionEvent().addAnonymousEventLog(factory, log.data, ...log.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([createFinding(token0, token1, pair0)]);
  });

  it("should detect multiple events from the contract", async () => {
    const log1 = SWAP_FACTORY_IFACE.encodeEventLog(SWAP_FACTORY_IFACE.getEvent("PairCreated"), [
      token0,
      token1,
      pair0,
      "0",
    ]);

    const log2 = SWAP_FACTORY_IFACE.encodeEventLog(SWAP_FACTORY_IFACE.getEvent("PairCreated"), [
      token2,
      token3,
      pair1,
      "0",
    ]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(factory, log1.data, ...log1.topics)
      .addAnonymousEventLog(factory, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([createFinding(token0, token1, pair0), createFinding(token2, token3, pair1)]);
  });
});
