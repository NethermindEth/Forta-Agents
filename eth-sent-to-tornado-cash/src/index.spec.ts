import {
  Finding,
  HandleTransaction,
  createTransactionEvent,
  TransactionEvent,
  EventType,
  Network,
} from "forta-agent";
import { provideHandleTransaction } from ".";
import { createFinding } from "./agent.utils";

const createTxEventWithGasUsed = (gasUsed: string) =>
  createTransactionEvent({
    transaction: {} as any,
    receipt: { gasUsed } as any,
    block: {} as any,
  });

const createTxEvent = (
  from: string,
  to: string,
  value: string,
  timestamp: string
): TransactionEvent => {
  return createTransactionEvent({
    type: EventType.BLOCK,
    network: Network.MAINNET,
    transaction: { from: from, to: to, value: value } as any,
    receipt: {} as any,
    block: { timestamp: timestamp } as any,
  });
};

describe("Tornado Cash Agent Test Suite", () => {
  let handleTransaction: HandleTransaction,
    tornadoAddresses: string[],
    valueThreshold: bigint,
    timeLimit: bigint;

  beforeEach(() => {
    tornadoAddresses = [];
    valueThreshold = BigInt("10000");
    timeLimit = BigInt("1000");
    handleTransaction = provideHandleTransaction(
      tornadoAddresses,
      valueThreshold,
      timeLimit
    );
  });

  it("returns empty findings if it is not a tornado transaction", async () => {
    const txEvent = createTxEvent("0x0", "0x12", "1000000000", "100");

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if a transaction with a big value in sent into tornado", async () => {
    const txEvent = createTxEvent("0x0", tornadoAddresses[0], "1000000", "100");

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([createFinding("0x0")]);
  });

  it("returns empty findings if any address has passed the threshold value", async () => {
    let txEvent: TransactionEvent, findings: Finding[];

    txEvent = createTxEvent("0x0", tornadoAddresses[0], "1000", "100");
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    txEvent = createTxEvent("0x1", tornadoAddresses[0], "6000", "100");
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    txEvent = createTxEvent("0x0", tornadoAddresses[0], "4000", "100");
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    txEvent = createTxEvent("0x1", tornadoAddresses[0], "3000", "100");
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("returns findings taking in account only transaction inside the correct time frame", async () => {
    let txEvent: TransactionEvent, findings: Finding[];

    txEvent = createTxEvent("0x0", tornadoAddresses[0], "9000", "100");
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    txEvent = createTxEvent("0x0", tornadoAddresses[0], "9000", "1200");
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);

    txEvent = createTxEvent("0x0", tornadoAddresses[0], "2000", "1300");
    findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([createFinding("0x0")]);
  });

});
