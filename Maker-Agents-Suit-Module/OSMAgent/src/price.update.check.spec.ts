import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import providePriceUpdateCheckHandler, {
  createFinding,
  MEGAPOKER_CONTRACT,
} from "./price.update.check";

import { TestTransactionEvent } from "forta-agent-tools";

const pokeFunctionSelector = "0x18178358";
const previousHourForActivatingAgent = 1467018381;
const lessThanTenMinutes = 1467021981; // "Mon, 27 Jun 2016 10:06:21 GMT"
const greaterThanTenMinutes = 1467022981; // "Mon, 27 Jun 2016 10:23:01 GMT"
const differentHour = 1467032181; // "Mon, 27 Jun 2016 12:56:21 GMT"

describe("Poker Method", () => {
  let handleTransaction: HandleTransaction;

  it("should returns empty findings in the first hour", async () => {
    handleTransaction = providePriceUpdateCheckHandler();
    let findings: Finding[] = [];

    const txEvent = new TestTransactionEvent().setTimestamp(
      greaterThanTenMinutes
    );

    findings = findings.concat(await handleTransaction(txEvent));

    expect(findings).toStrictEqual([]);
  });

  it("should returns empty findings in the first hour", async () => {
    handleTransaction = providePriceUpdateCheckHandler();
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(
      lessThanTenMinutes
    );
    const txEvent2 = new TestTransactionEvent().setTimestamp(
      greaterThanTenMinutes
    );

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));

    expect(findings).toStrictEqual([]);
  });

  it("should returns empty findings if the function was correctly called", async () => {
    handleTransaction = providePriceUpdateCheckHandler();
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    );
    const txEvent2 = new TestTransactionEvent()
      .addTraces({ to: MEGAPOKER_CONTRACT, input: pokeFunctionSelector })
      .setTimestamp(lessThanTenMinutes);
    const txEvent3 = new TestTransactionEvent().setTimestamp(
      greaterThanTenMinutes
    );

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));

    expect(findings).toStrictEqual([]);
  });

  it("should returns a finding if the function is not called in that hour", async () => {
    handleTransaction = providePriceUpdateCheckHandler();
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    );
    const txEvent2 = new TestTransactionEvent().setTimestamp(
      lessThanTenMinutes
    );
    const txEvent3 = new TestTransactionEvent().setTimestamp(
      greaterThanTenMinutes
    );

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));

    expect(findings).toStrictEqual([createFinding()]);
  });

  it("should returns a finding if the function was not called in the first ten minutes", async () => {
    handleTransaction = providePriceUpdateCheckHandler();
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    );
    const txEvent2 = new TestTransactionEvent().setTimestamp(
      lessThanTenMinutes
    );
    const txEvent3 = new TestTransactionEvent()
      .addTraces({ to: MEGAPOKER_CONTRACT, input: pokeFunctionSelector })
      .setTimestamp(greaterThanTenMinutes);

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));

    expect(findings).toStrictEqual([createFinding()]);
  });

  it("should returns a finding for every hour in which function is not called in the first ten minutes", async () => {
    handleTransaction = providePriceUpdateCheckHandler();
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    );
    const txEvent2 = new TestTransactionEvent().setTimestamp(
      lessThanTenMinutes
    );
    const txEvent3 = new TestTransactionEvent()
      .addTraces({ to: MEGAPOKER_CONTRACT, input: pokeFunctionSelector })
      .setTimestamp(greaterThanTenMinutes);
    const txEvent4 = new TestTransactionEvent().setTimestamp(differentHour);

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));
    findings = findings.concat(await handleTransaction(txEvent4));

    expect(findings).toStrictEqual([createFinding(), createFinding()]);
  });

  it("should report findings only once per hour", async () => {
    handleTransaction = providePriceUpdateCheckHandler();
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(
      previousHourForActivatingAgent
    );
    const txEvent2 = new TestTransactionEvent().setTimestamp(
      greaterThanTenMinutes
    );
    const txEvent3 = new TestTransactionEvent().setTimestamp(
      greaterThanTenMinutes
    );

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));

    expect(findings).toStrictEqual([createFinding()]);
  });
});
