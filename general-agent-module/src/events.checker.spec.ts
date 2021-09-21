import { HandleTransaction, Finding, Transaction, TransactionEvent, Log } from "forta-agent";
import { generalTestFindingGenerator, TestTransactionEvent } from "./tests.utils";
import provideEventCheckerHandler from "./events.checker";

const EVENT_SIGNATURE = "testSignature(bool,address)";

describe("Event Checker Agent Tests", () => {
  let transactionHandler: HandleTransaction;

  it("should returns empty findings if expected event is not found", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE);
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog("badSignature", "0x121212");

    const findings: Finding[] = await transactionHandler(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns empty findings if the event wasn't emitted from the correct address", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE, "0x131313");
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x1212");

    const findings: Finding[] = await transactionHandler(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should returns a finding if expected event was emitted from the correct address", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE, "0x121212");
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x121212");

    const findings: Finding[] = await transactionHandler(txEvent);

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent)]);
  });

  it("should returns findings every time the expected event is emitted from any address if no address was specified", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE);

    const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x121212");
    let findings: Finding[] = await transactionHandler(txEvent1);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x131313");
    findings = findings.concat(await transactionHandler(txEvent2));

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent1), generalTestFindingGenerator(txEvent2)]);
  });

  it("should returns findings only when then event is emitted from the correct address", async () => {
    transactionHandler = provideEventCheckerHandler(generalTestFindingGenerator, EVENT_SIGNATURE, "0x121212");

    const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x121212");
    let findings: Finding[] = await transactionHandler(txEvent1);

    const txEvent2: TransactionEvent = new TestTransactionEvent().addEventLog(EVENT_SIGNATURE, "0x131313");
    findings = findings.concat(await transactionHandler(txEvent2));

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent1)]);
  });

  it("should returns empty findings with filtered function", async () => {
    const filterLog = (log: Log): boolean => {
      const number = Number(BigInt(log.data)) / 10 ** 18;
      if (number > 2) {
        return true;
      }

      return false;
    };

    transactionHandler = provideEventCheckerHandler(
      generalTestFindingGenerator,
      EVENT_SIGNATURE,
      "0x121212",
      filterLog
    );

    const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
      EVENT_SIGNATURE,
      "0x121212",
      [],
      "0x000000000000000000000000000000000000000000000000000eebe0b40e8000" // 0.0042
    );
    let findings: Finding[] = await transactionHandler(txEvent1);

    expect(findings).toStrictEqual([]);
  });

  it("should returns findings with filtered function if condition met", async () => {
    const filterLog = (log: Log): boolean => {
      const number = Number(BigInt(log.data)) / 10 ** 18;
      if (number > 2) {
        return true;
      }

      return false;
    };

    transactionHandler = provideEventCheckerHandler(
      generalTestFindingGenerator,
      EVENT_SIGNATURE,
      "0x121212",
      filterLog
    );

    const txEvent1: TransactionEvent = new TestTransactionEvent().addEventLog(
      EVENT_SIGNATURE,
      "0x121212",
      [],
      "0x00000000000000000000000000000000000000000000000029a2241af62c0000" // 3
    );
    let findings: Finding[] = await transactionHandler(txEvent1);

    expect(findings).toStrictEqual([generalTestFindingGenerator(txEvent1)]);
  });
});
