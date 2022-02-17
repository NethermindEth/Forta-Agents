import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import { provideHandleTransaction } from "./agent";
import { ORACLE_ABI, REALITY_ABI } from "./utils";

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
  else
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
};
describe("answers submission agent", () => {
  const reality_module = createAddress("0xffee");
  const oracle_address = createAddress("0xfede");
  const different_oracle = createAddress("0xd4");
  const questions = [
    // array of test questions.
    "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc24",
    "0x8ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc34",
    "0x9ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc44",
    "0xaca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc52",
  ];

  let handler: HandleTransaction;

  beforeAll(async () => {
    handler = provideHandleTransaction(reality_module, oracle_address);

    // agent will save the questions ids.
    const tx = new TestTransactionEvent();
    questions.forEach((question) => {
      const log = REALITY_ABI.encodeEventLog(
        REALITY_ABI.getEvent("ProposalQuestionCreated"),
        [question, "prop"]
      );
      tx.addAnonymousEventLog(reality_module, log.data, ...log.topics);
    });
    await handler(tx);
  });

  it("should ignore empty transactions", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore answers events emitted from a different oracle", async () => {
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
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(different_oracle, log1.data, ...log1.topics)
      .addAnonymousEventLog(different_oracle, log2.data, ...log2.topics);

    const findings = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore answers for a non monitored question", async () => {
    const different_questionId =
      "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc22";

    const log1 = ORACLE_ABI.encodeEventLog(
      ORACLE_ABI.getEvent("LogNewAnswer"),
      [
        "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc25",
        different_questionId,
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
        different_questionId,
        createAddress("0x3fe3"),
        "0x7ca0eb796b737d1d6fce75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc26",
        "0x7ca0eb796b737d1d6fbe75cae0c351c4626ce7d826ceff3a9f91ec8d2282cc25",
        4,
        55,
      ]
    );
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(oracle_address, log1.data, ...log1.topics)
      .addAnonymousEventLog(oracle_address, log2.data, ...log2.topics);

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
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(oracle_address, log1.data, ...log1.topics)
      .addAnonymousEventLog(oracle_address, log2.data, ...log2.topics);

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
    ]);
  });
});
