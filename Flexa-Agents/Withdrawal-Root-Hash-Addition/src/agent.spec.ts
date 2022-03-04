import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { utils } from "ethers";
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import { provideHandleTransaction, WITHDRAWAL_ROOT_HASH_ADDITION_SIGNATURE } from "./agent";

const IFACE: utils.Interface = new utils.Interface([
  WITHDRAWAL_ROOT_HASH_ADDITION_SIGNATURE,
  // This event is just for testing purposes
  "event IrrelevantEvent(bytes32 indexed rootHash, uint256 indexed nonce)"
]);

const factory: string = createAddress("0xa0");
const unixTime = 1645787209;

const createFinding = (txDate: number, txEvent: TransactionEvent) => {
  const time = new Date(txDate * 1000);

  return Finding.fromObject({
    name: "Flexa withdrawal root event",
    description: "A new withdrawal root hash is added to the active set",
    alertId: "FLEXA-3",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Flexa",
    metadata: {
      timestamp: txEvent.timestamp.toString(),
      timeUTC: time.toUTCString()
    }
  });
};

describe("Flexa Withdrawal Root Hash Addition Agent Test Suite", () => {
  const handler: HandleTransaction = provideHandleTransaction(factory);

  it("should ignore empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore same events from other contracts", async () => {
    const log = IFACE.encodeEventLog(IFACE.getEvent("WithdrawalRootHashAddition"), [
      "0x469d8ac2d6af2747f17ec8db2b783a24cf1ae0d08e5b4d16d908b7f90f63e90d",
      "1"
    ]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(createAddress("0xd4"), log.data, ...log.topics)
      .setTimestamp(unixTime);

    const findings = await handler(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should ignore different event from same contract", async () => {
    const log = IFACE.encodeEventLog(IFACE.getEvent("IrrelevantEvent"), [
      "0x469d8ac2d6af2747f17ec8db2b783a24cf1ae0d08e5b4d16d908b7f90f63e90d",
      "1"
    ]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(factory, log.data, ...log.topics)
      .setTimestamp(unixTime);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect single event from the contract", async () => {
    const log = IFACE.encodeEventLog(IFACE.getEvent("WithdrawalRootHashAddition"), [
      "0x469d8ac2d6af2747f17ec8db2b783a24cf1ae0d08e5b4d16d908b7f90f63e90d",
      "1"
    ]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(factory, log.data, ...log.topics)
      .setTimestamp(unixTime);

    const findings = await handler(tx);

    expect(findings).toStrictEqual([createFinding(unixTime, tx)]);
  });

  it("should detect multiple events from the contract", async () => {
    const log1 = IFACE.encodeEventLog(IFACE.getEvent("WithdrawalRootHashAddition"), [
      "0x469d8ac2d6af2747f17ec8db2b783a24cf1ae0d08e5b4d16d908b7f90f63e90d",
      "1"
    ]);

    const log2 = IFACE.encodeEventLog(IFACE.getEvent("WithdrawalRootHashAddition"), [
      "0x469d8ac2d6af2747f17ec8db2b783a24cf1ae0d08e5b4d16d908b7f90f63e90d",
      "2"
    ]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(factory, log1.data, ...log1.topics)
      .addAnonymousEventLog(factory, log2.data, ...log2.topics)
      .setTimestamp(unixTime);

    const findings = await handler(tx);

    expect(findings).toStrictEqual([createFinding(unixTime, tx), createFinding(unixTime, tx)]);
  });
});
