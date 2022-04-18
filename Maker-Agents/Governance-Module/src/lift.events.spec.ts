import { utils } from "ethers";
import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { AddressVerifier, generateAddressVerifier, LiftFinding } from "./utils";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { createFinding, provideLiftEventsListener as provider } from "./lift.events";

const encodedAddr = (addr: string) => utils.defaultAbiCoder.encode(["address"], [createAddress(addr)]);

const alertId: string = "Test Finding";
const chief: string = createAddress("0xa");
const topic: string = encodedAddr("0xFF");

const isKnown: AddressVerifier = generateAddressVerifier([
  createAddress("0xb"),
  createAddress("0xc"),
  createAddress("0xd"),
]);

describe("Lift Events listener test suite", () => {
  const handleTransaction: HandleTransaction = provider(alertId, chief, isKnown, isKnown, topic);

  it("should return 0 findings from empty transaction", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return 0 findings if the event is not emitted correctly by the address", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(createAddress("0x1"), createAddress("0x2"), chief)
      .addAnonymousEventLog(createAddress("0x1"), "0x", topic, encodedAddr("0x2"), encodedAddr("0xdead"))
      .addAnonymousEventLog(createAddress("0x1"), "0x", topic, encodedAddr("0x3"), encodedAddr("0xdead"))
      .addAnonymousEventLog(chief, "0x", topic, encodedAddr("0xdead"))
      .addAnonymousEventLog(chief, "0x", encodedAddr("0x1"), encodedAddr("0x2"));

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("Should return 0 findings if the address are known", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(createAddress("0x1"), createAddress("0x2"), chief)
      .addAnonymousEventLog(chief, "0x", topic, encodedAddr("0xb"), encodedAddr("0xc"))
      .addAnonymousEventLog(chief, "0x", topic, encodedAddr("0xd"), encodedAddr("0xb"))
      .addAnonymousEventLog(chief, "0x", topic, encodedAddr("0xc"), encodedAddr("0xd"));

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("Should detect unknown addresses in the event", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(createAddress("0x1"), createAddress("0x2"), chief)
      .addAnonymousEventLog(chief, "0x", topic, encodedAddr("0xb"), encodedAddr("0xc1"))
      .addAnonymousEventLog(chief, "0x", topic, encodedAddr("0xd2"), encodedAddr("0xb"))
      .addAnonymousEventLog(chief, "0x", topic, encodedAddr("0xc3"), encodedAddr("0xd3"));

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding(alertId, createAddress("0xc1"), LiftFinding.Spell),
      createFinding(alertId, createAddress("0xd2"), LiftFinding.Lifter),
      createFinding(alertId, createAddress("0xc3"), LiftFinding.Lifter),
      createFinding(alertId, createAddress("0xd3"), LiftFinding.Spell),
    ]);
  });
});
