import { HandleTransaction, Finding } from "forta-agent";
import { createTxEventWithEventLogged, generalTestFindingGenerator } from "./tests.utils";
import provideEventCheckerHandler from "./events.checker";



const EVENT_SIGNATURE = "testSignature(bool,address)";

describe("Event Checker Agent Tests", () => {
  let transactionHandler: HandleTransaction;

  it("should returns empty findings if expected event is not found", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE);
    const txEvent = createTxEventWithEventLogged("badSignature", "0x1212");

    const findings: Finding[] = await transactionHandler(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns empty findings if the event wasn't emitted from the correct address", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE, "0x131313");
    const txEvent = createTxEventWithEventLogged(EVENT_SIGNATURE, "0x1212");

    const findings: Finding[] = await transactionHandler(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns a finding if expected event was emitted from the correct address", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE, "0x121212");
    const txEvent = createTxEventWithEventLogged(EVENT_SIGNATURE, "0x121212");

    const findings: Finding[] = await transactionHandler(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent)]);
  });

  it("should returns findings every time the expected event is emitted from any address if no address was specified", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE);

    const txEvent1 = createTxEventWithEventLogged(EVENT_SIGNATURE, "0x121212");
    let findings: Finding[] = await transactionHandler(txEvent1);

    const txEvent2 = createTxEventWithEventLogged(EVENT_SIGNATURE, "0x131313");
    findings = findings.concat(await transactionHandler(txEvent2));

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent1), generalTestFindingGenerator(txEvent2)]);
  });

  it("should returns findings only when then event is emitted from the correct address", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE, "0x121212");

    const txEvent1 = createTxEventWithEventLogged(EVENT_SIGNATURE, "0x121212");
    let findings: Finding[] = await transactionHandler(txEvent1);

    const txEvent2 = createTxEventWithEventLogged(EVENT_SIGNATURE, "0x131313");
    findings = findings.concat(await transactionHandler(txEvent2));

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent1)]);
  });
});
