import { Interface } from "@ethersproject/abi";
import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";
import { ORACLE_ABI } from "./utils";

const createFinding = (
  name: string,
  questionId: string,
  answer: string,
  user: string,
  commitment: boolean | undefined
) => {
  if (name === "LogNewAnswer")
    return Finding.fromObject({
      name: "Answers submission alert",
      description: "An answer has been submitted to a question",
      alertId: "GNOSIS-3-1",
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      protocol: "Gnosis SafeSnap",
      metadata: {
        questionId,
        answer,
        user,
        commitment: commitment ? "yes" : "no",
      },
    });
  else if (name === "LogAnswerReveal")
    return Finding.fromObject({
      name: "Answers submission alert",
      description: "An answer has been revealed",
      alertId: "GNOSIS-3-2",
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      protocol: "Gnosis SafeSnap",
      metadata: {
        questionId,
        answer,
        user,
      },
    });
  else
    return Finding.fromObject({
      name: "Question finalized alert",
      description: "A question has been finalized",
      alertId: "GNOSIS-3-3",
      type: FindingType.Info,
      severity: FindingSeverity.Info,
      protocol: "Gnosis SafeSnap",
      metadata: {
        questionId,
        answer,
      },
    });
};

describe("answers submission agent", () => {
  const oracle_address = createAddress("0xfede");
  const different_oracle = createAddress("0xd4");
  const WRONG_EVENT_SIGNATURE = "event wrong_sig()";
  const questions = [
    // array of test questions.
    "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc24",
    "0x8ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc34",
    "0x9ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc44",
    "0xaca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc52",
  ];

  let handler: HandleTransaction;

  beforeAll(async () => {
    handler = provideHandleTransaction(oracle_address);
  });

  it("should ignore empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore answers events emitted on a different oracle", async () => {
    const log1 = ORACLE_ABI.encodeEventLog(
      ORACLE_ABI.getEvent("LogNewAnswer"),
      [
        "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc25",
        questions[0],
        "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc26",
        createAddress("0x3fe3"),
        55,
        4,
        false,
      ]
    );
    const log2 = ORACLE_ABI.encodeEventLog(
      ORACLE_ABI.getEvent("LogAnswerReveal"),
      [
        questions[1],
        createAddress("0x3fe3"),
        "0x7ca0eb796b737d1d6fce75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc26",
        "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc25",
        4,
        55,
      ]
    );
    const log3 = ORACLE_ABI.encodeEventLog(ORACLE_ABI.getEvent("LogFinalize"), [
      questions[1],
      "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc25",
    ]);

    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(different_oracle, log1.data, ...log1.topics)
      .addAnonymousEventLog(different_oracle, log2.data, ...log2.topics)
      .addAnonymousEventLog(different_oracle, log3.data, ...log3.topics);

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other events on the oracle", async () => {
    const WRONG_ABI = new Interface([WRONG_EVENT_SIGNATURE]);
    const log1 = WRONG_ABI.encodeEventLog(WRONG_ABI.getEvent("wrong_sig"), []);
    const tx: TransactionEvent =
      new TestTransactionEvent().addAnonymousEventLog(
        oracle_address,
        log1.data,
        ...log1.topics
      );
    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should return multiple findings", async () => {
    const log1 = ORACLE_ABI.encodeEventLog(
      ORACLE_ABI.getEvent("LogNewAnswer"),
      [
        "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc25",
        questions[2],
        "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc26",
        createAddress("0x3fe3"),
        55,
        4,
        true,
      ]
    );
    const log2 = ORACLE_ABI.encodeEventLog(
      ORACLE_ABI.getEvent("LogAnswerReveal"),
      [
        questions[3],
        createAddress("0x3fe3"),
        "0x7ca0eb796b737d1d6fce75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc26",
        "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc25",
        4,
        55,
      ]
    );
    const log3 = ORACLE_ABI.encodeEventLog(ORACLE_ABI.getEvent("LogFinalize"), [
      questions[3],
      "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc25",
    ]);
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(oracle_address, log1.data, ...log1.topics)
      .addAnonymousEventLog(oracle_address, log2.data, ...log2.topics)
      .addAnonymousEventLog(oracle_address, log3.data, ...log3.topics);

    const findings = await handler(tx);
    expect(findings).toStrictEqual([
      createFinding(
        "LogNewAnswer",
        questions[2],
        "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc25",
        createAddress("0x3fe3"),
        true
      ),
      createFinding(
        "LogAnswerReveal",
        questions[3],
        "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc25",
        createAddress("0x3fe3"),
        undefined
      ),
      createFinding(
        "LogFinalize",
        questions[3],
        "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc25",
        createAddress("0x3fe3"),
        undefined
      ),
    ]);
  });
});
