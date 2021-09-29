import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import agent from "./priceUpdateCheck";

import { TestTransactionEvent } from "@nethermindeth/general-agents-module";

describe("Poker Method", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  it("No response if different protocol", async () => {
    const txEvent: TransactionEvent = {
      addresses: { "0x0000000000000000000000000000000000000000": true },
      traces: [],
    } as any;

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("Time < 10min, nothing returned, first time function call: sets status to true", async () => {
    const txEvent = new TestTransactionEvent().addInvolvedAddress(
      "0x2417c2762ec12f2696f62cfa5492953b9467dc81"
    );
    txEvent.block.timestamp = 1469021981; // 9 minutes hour - 19

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("getStatus after time has lasped > 10 min and the status is true", async () => {
    const txEvent = new TestTransactionEvent().addInvolvedAddress(
      "0x2417c2762ec12f2696f62cfa5492953b9467dc81"
    );
    txEvent.block.timestamp = 1469022581; // 19 minutes hour - 19

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("getStatus after time has lasped > 10 min and the status is false due to hour change, should return a critical shoutout", async () => {
    const txEvent = new TestTransactionEvent().addInvolvedAddress(
      "0x2417c2762ec12f2696f62cfa5492953b9467dc81"
    );
    txEvent.block.timestamp = 1469332581; // hour - 9 minutes - 26

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        alertId: "NETHFORTA-24",
        description: "Poke() function not called within 10 minutes of the hour",
        name: "Method not called within the first 10 minutes",
        severity: 5,
        type: 0,
      }),
    ]);
  });

  it("if the hour changes and the call is not make at all, throw an alert", async () => {
    const txEvent = new TestTransactionEvent().addInvolvedAddress(
      "0x2417c2762ec12f2696f62cfa5492953b9467dc81"
    );
    txEvent.block.timestamp = 1465332581; // hour - 9 minutes - 26

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      Finding.fromObject({
        alertId: "NETHFORTA-24",
        description: "Poke() function not called within 10 minutes of the hour",
        name: "Method not called within the first 10 minutes",
        severity: 5,
        type: 0,
      }),
    ]);
  });
});
