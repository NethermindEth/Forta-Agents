import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { provideHandleTransaction  } from "./agent";
import {
  TestTransactionEvent,
  createAddress,
  encodeFunctionCall,
} from "forta-agent-tools";
import { reportLossABI } from "./utils";

const strategyAddresses = [createAddress("0x0"), createAddress("0x1")];

const createFinding = (strategyAddress: string, lossValue: string): Finding => {
  return Finding.fromObject({
    name: "",
    description: "",
    alertId: "",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: {
      strategyAddress: strategyAddress,
      lossValue: lossValue,
    },
  });
};

describe("Reported Loss Agent", () => {
  let handleTransaction: HandleTransaction;

  it("should return empty findings if not reportLoss is called", async () => {
    handleTransaction = provideHandleTransaction  ();

    let findings: Finding[] = [];

    const txEvent: TransactionEvent = new TestTransactionEvent();

    findings = findings.concat(await handleTransaction(txEvent));

      expect(findings).toStrictEqual([]);
  });

  it("should returns finding if reportLoss was called", async () => {
    handleTransaction = provideHandleTransaction();

    let findings: Finding[] = [];

    const txEvent: TransactionEvent = new TestTransactionEvent().addTraces({
      input: encodeFunctionCall(reportLossABI as any, [
        strategyAddresses[0],
        "100",
      ]),
    });

    findings = findings.concat(await handleTransaction(txEvent));

    expect(findings).toStrictEqual([
      createFinding(strategyAddresses[0], "100"),
    ]);
  });

  it("should returns multiple findings if reportLoss was called multiple times", async () => {
    handleTransaction = provideHandleTransaction();

    let findings: Finding[] = [];

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addTraces({
        input: encodeFunctionCall(reportLossABI as any, [
          strategyAddresses[0],
          "100",
        ]),
      })
      .addTraces({
        input: encodeFunctionCall(reportLossABI as any, [
          strategyAddresses[1],
          "150",
        ]),
      });

    findings = findings.concat(await handleTransaction(txEvent));

    expect(findings).toStrictEqual([
      createFinding(strategyAddresses[0], "100"),
      createFinding(strategyAddresses[1], "150"),
    ]);
  });
});
