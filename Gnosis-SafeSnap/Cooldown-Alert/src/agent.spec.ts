import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  HandleBlock,
  createTransactionEvent,
  TransactionEvent,
  BlockEvent,
  Trace
} from "forta-agent";
import {
  createAddress,
  TestBlockEvent,
  TestTransactionEvent,
  encodeParameters,
  runBlock,
  Agent
} from "forta-agent-tools";
import {
  propQuestionCreatedSig
} from "./abi";
import {
  provideHandleBlock,
  provideHandleTransaction
} from "./agent";

const testMsgSender: string = createAddress("0xda456f");
const testRealitioErc20: string = createAddress("0x2d5ef8");
const testDaoModule: string = createAddress("0xac689d");

describe("high gas agent", () => {
  let handleBlock: HandleBlock;
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleBlock = provideHandleBlock(
      testRealitioErc20,
      testDaoModule
    ),
    handleTransaction = provideHandleTransaction(
      testDaoModule
    )
  })

  it("should return a Finding from detecting when a ProposalQuestionCreated event emission", async () => {
    const testQuestionId: string = "0x324567fff";
    const testPropId: string = "d34d";

    const testTopics: string[] = [
      encodeParameters(["bytes32"], [testQuestionId]),
      encodeParameters(["string"], [testPropId])
    ];

    const testData: string = "0xd34db3ef"

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testDaoModule)
      .addEventLog(propQuestionCreatedSig, testDaoModule, testData, ...testTopics);

    const findings = await handleTransaction(txEvent);

    // expect(findings).toStrictEqual([]);
  });

  /*
  it("should return a Finding from detecting when a question's cooldown starts", async () => {
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setHash("0x000000000000000000000000000000000000d34db3ef")
      .setNumber(1256000)

    const agent: Agent = {
      handleTransaction: provideHandleTransaction(),
      handleBlock: provideHandleBlock(
        testRealitioErc20,
        testDaoModule
      )
    }

    const findings: Finding[] = await runBlock(agent, blockEvent, txEvent);

    expect(findings).toStrictEqual([]);
  });
  */
})
