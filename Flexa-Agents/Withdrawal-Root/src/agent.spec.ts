import { Finding, FindingSeverity, FindingType, HandleTransaction, TransactionEvent } from "forta-agent";
import { BigNumber, utils } from "ethers";
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import { provideHandleTransaction, WITHDRAWAL_ROOT_HASH_ADDITION_SIGNATURE } from "./agent";

const IFACE: utils.Interface = new utils.Interface([
  WITHDRAWAL_ROOT_HASH_ADDITION_SIGNATURE,
  // This event is just for testing purposes
  "event IrrelevantEvent(bytes32 indexed rootHash, uint256 indexed nonce)"
]);

const factory: string = createAddress("0xa0");
const unixTime = 1645787209;
const rootHash: string[] = [
  "0x469d8ac2d6af2747f17ec8db2b783a24cf1ae0d08e5b4d16d908b7f90f63e90d",
  "0xb37419de8355f86066bbf033ca918c18b7287a9950b7d280bdd73b7e168954ae"
];
const nonce: BigNumber[] = [BigNumber.from(7858), BigNumber.from(7857)];

const createFinding = (timestamp: number, rootHash: string, nonce: string) => {
  const time = new Date(timestamp * 1000);

  return Finding.fromObject({
    name: "Flexa Withdrawal Root Hash alert",
    description: "A new withdrawal root hash is added to the active set",
    alertId: "FLEXA-4",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Flexa",
    metadata: {
      timestamp: timestamp.toString(),
      timeUTC: time.toUTCString(),
      rootHash,
      nonce
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
    const log = IFACE.encodeEventLog(IFACE.getEvent("WithdrawalRootHashAddition"), [rootHash[0], nonce[0]]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(createAddress("0xd4"), log.data, ...log.topics)
      .setTimestamp(unixTime);

    const findings = await handler(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should ignore different event from same contract", async () => {
    const log = IFACE.encodeEventLog(IFACE.getEvent("IrrelevantEvent"), [rootHash[0], nonce[0]]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(factory, log.data, ...log.topics)
      .setTimestamp(unixTime);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect single event from the contract", async () => {
    const log = IFACE.encodeEventLog(IFACE.getEvent("WithdrawalRootHashAddition"), [rootHash[0], nonce[0]]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(factory, log.data, ...log.topics)
      .setTimestamp(unixTime);

    const findings = await handler(tx);

    expect(findings).toStrictEqual([createFinding(unixTime, rootHash[0], nonce[0].toString())]);
  });

  it("should detect multiple events from the contract", async () => {
    const log1 = IFACE.encodeEventLog(IFACE.getEvent("WithdrawalRootHashAddition"), [rootHash[0], nonce[0]]);

    const log2 = IFACE.encodeEventLog(IFACE.getEvent("WithdrawalRootHashAddition"), [rootHash[1], nonce[1]]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(factory, log1.data, ...log1.topics)
      .addAnonymousEventLog(factory, log2.data, ...log2.topics)
      .setTimestamp(unixTime);

    const findings = await handler(tx);

    expect(findings).toStrictEqual([
      createFinding(unixTime, rootHash[0].toString(), nonce[0].toString()),
      createFinding(unixTime, rootHash[1].toString(), nonce[1].toString())
    ]);
  });
});
