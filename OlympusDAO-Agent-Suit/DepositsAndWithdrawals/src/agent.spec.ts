import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
} from "forta-agent";
import { provideHandleTransaction } from "./agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { BigNumber } from "ethers";

const depositFinding = (
  token: string,
  amount: number,
  value: number
): Finding =>
  Finding.fromObject({
    name: "OlympusDAO Treasury High tokens movement detected",
    description: "High Deposit",
    alertId: "olympus-treasury-5-1",
    severity: FindingSeverity.Info,
    type: FindingType.Suspicious,
    protocol: "OlympusDAO",
    metadata: {
      token,
      amount: amount.toString(),
      value: value.toString(),
    },
  });

const withdrawalFinding = (
  token: string,
  amount: number,
  value: number
): Finding =>
  Finding.fromObject({
    name: "OlympusDAO Treasury High tokens movement detected",
    description: "High Withdrawal",
    alertId: "olympus-treasury-5-2",
    severity: FindingSeverity.Info,
    type: FindingType.Suspicious,
    protocol: "OlympusDAO",
    metadata: {
      token,
      amount: amount.toString(),
      value: value.toString(),
    },
  });

describe("Ownership Transfers Test Suite", () => {
  const treasury: string = createAddress("0xdead");
  const handler: HandleTransaction = provideHandleTransaction(
    treasury,
    BigNumber.from(500)
  );

  it("should ignore transactions not emitting events", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore transactions not emitting the correct event", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent().addEventLog(
      "event TestEvent( address indexed token, uint amount, uint value )",
      createAddress("0xbee"),
      [createAddress("0xc0de"), 5000, 50000]
    );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore transactions emitting the correct event in the wrong contract", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent().addEventLog(
      "event Deposit( address indexed token, uint amount, uint value )",
      createAddress("0xbee"),
      [createAddress("0xc0de"), 5000, 50000]
    );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect high token movements", async () => {
    const params: [string, number, number][] = [
      [createAddress("0xc0de1"), 20, 200],
      [createAddress("0xc0de2"), 4, 510],
      [createAddress("0xc0de3"), 10000, 1],
      [createAddress("0xc0de4"), 200, 100000],
      [createAddress("0xc0de5"), 1, 3000],
    ];

    const expectedFindings: Finding[] = [];
    const tx: TestTransactionEvent = new TestTransactionEvent();

    for (let [token, amount, value] of params) {
      tx.addEventLog(
        "event Deposit(address indexed token, uint amount, uint value)",
        treasury,
        [token, amount, value]
      ).addEventLog(
        "event Withdrawal(address indexed token, uint amount, uint value)",
        treasury,
        [token, amount, value]
      );
      if (value > 500) {
        expectedFindings.push(
          depositFinding(token, amount, value),
          withdrawalFinding(token, amount, value)
        );
      }
    }

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual(expectedFindings);
  });
});
