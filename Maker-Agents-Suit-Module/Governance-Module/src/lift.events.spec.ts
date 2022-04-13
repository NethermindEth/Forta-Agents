import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createFinding, provideLiftEventsListener as provider } from "./lift.events";
import {
  argsToSet,
  AddressVerifier,
  createAddr,
  createEncodedAddr,
  generateAddressVerifier,
  createTxEvent,
  createLog,
  LiftFinding,
} from "./utils";

const alertId: string = "Test Finding";
const contract: string = createAddr("0xA");
const contractInLower: string = contract.toLowerCase();
const topic: string = createEncodedAddr("0xFF");
const isKnown: AddressVerifier = generateAddressVerifier("0xb", "0xc", "0xd");

describe("Lift Events listener test suite", () => {
  const handleTransaction: HandleTransaction = provider(alertId, contract, isKnown, topic);

  it("Should return 0 findings if the contract is not involve in the tx", async () => {
    const txEvent: TransactionEvent = createTxEvent(argsToSet(createAddr("0x1"), createAddr("0x2")));

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("Should return 0 findings if the event is not emited by the address", async () => {
    const txEvent: TransactionEvent = createTxEvent(
      argsToSet(createAddr("0x1"), createAddr("0x2"), createAddr(contract)),
      createLog(createAddr("0x1"), createEncodedAddr("0x11"), createEncodedAddr("0x123")),
      createLog(createAddr("0x2"), topic, createEncodedAddr("0x456"), createEncodedAddr("0x20"))
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("Should return 0 findings if the address are known", async () => {
    const txEvent: TransactionEvent = createTxEvent(
      argsToSet(createAddr("0x1"), createAddr("0x2"), contractInLower),
      createLog(contractInLower, topic, createEncodedAddr("0xb"), createEncodedAddr("0xc")),
      createLog(contractInLower, topic, createEncodedAddr("0xd"), createEncodedAddr("0xb")),
      createLog(contractInLower, topic, createEncodedAddr("0xc"), createEncodedAddr("0xd"))
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("Should detect unknown addresses in the event", async () => {
    const txEvent: TransactionEvent = createTxEvent(
      argsToSet(createAddr("0x1"), createAddr("0x2"), contractInLower),
      createLog(contractInLower, topic, createEncodedAddr("0xB"), createEncodedAddr("0xC1")),
      createLog(contractInLower, topic, createEncodedAddr("0xD2"), createEncodedAddr("0xB")),
      createLog(contractInLower, topic, createEncodedAddr("0xC3"), createEncodedAddr("0xD3"))
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      createFinding(alertId, createAddr("0xc1"), LiftFinding.Spell),
      createFinding(alertId, createAddr("0xd2"), LiftFinding.Lifter),
      createFinding(alertId, createAddr("0xc3"), LiftFinding.Lifter),
      createFinding(alertId, createAddr("0xd3"), LiftFinding.Spell),
    ]);
  });
});
