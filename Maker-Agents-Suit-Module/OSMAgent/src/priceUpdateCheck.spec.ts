import {
  Finding,
  HandleTransaction,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import providePriceUpdateCheckHandler, { createFinding } from "./priceUpdateCheck";

import { TestTransactionEvent } from "@nethermindeth/general-agents-module";

const megaPokerAddress = "0x2417c2762ec12f2696f62cfa5492953b9467dc81";
const pokeFunctionSelector = "0x18178358";
const lessThanTenMinutes = 1467021981; // "Mon, 27 Jun 2016 10:06:21 GMT"
const greaterThanTenMinures = 1467022981; // "Mon, 27 Jun 2016 10:23:01 GMT"
const differentHour = 1467032181; // "Mon, 27 Jun 2016 12:56:21 GMT"

describe("Poker Method", () => {
  let handleTransaction: HandleTransaction;

  it("should returns empty findings if the function was correctly called", async () => {
    handleTransaction = providePriceUpdateCheckHandler();
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent()
      .addTrace({ to: megaPokerAddress, input: pokeFunctionSelector })
      .setTimestamp(lessThanTenMinutes);
    const txEvent2 = new TestTransactionEvent().setTimestamp(
      greaterThanTenMinures
    );

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));

    expect(findings).toStrictEqual([]);
  });

  it("should returns a finding if the function is not called in that hour", async () => {
    handleTransaction = providePriceUpdateCheckHandler();
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(
      lessThanTenMinutes
    );
    const txEvent2 = new TestTransactionEvent().setTimestamp(
      greaterThanTenMinures
    );

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));

    expect(findings).toStrictEqual([ createFinding() ]);
  });

  it("should returns a finding if the function was not called in the first ten minutes", async () => {
    handleTransaction = providePriceUpdateCheckHandler();
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(
      lessThanTenMinutes
    );
    const txEvent2 = new TestTransactionEvent()
      .addTrace({ to: megaPokerAddress, input: pokeFunctionSelector })
      .setTimestamp(greaterThanTenMinures);

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));

    expect(findings).toStrictEqual([ createFinding() ]);
  });

  it("should returns a finding for every hour in which function is not called in the first ten minutes", async () => {
    handleTransaction = providePriceUpdateCheckHandler();
    let findings: Finding[] = [];

    const txEvent1 = new TestTransactionEvent().setTimestamp(
      lessThanTenMinutes
    );
    const txEvent2 = new TestTransactionEvent()
      .addTrace({ to: megaPokerAddress, input: pokeFunctionSelector })
      .setTimestamp(greaterThanTenMinures);
    const txEvent3 = new TestTransactionEvent().setTimestamp(differentHour);

    findings = findings.concat(await handleTransaction(txEvent1));
    findings = findings.concat(await handleTransaction(txEvent2));
    findings = findings.concat(await handleTransaction(txEvent3));

    expect(findings).toStrictEqual([ createFinding(), createFinding() ]);
  });
});
