import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  HandleBlock,
  TransactionEvent,
  BlockEvent,
} from "forta-agent";
import {
  createAddress,
  TestBlockEvent,
  TestTransactionEvent,
  encodeParameters,
} from "forta-agent-tools";
import {
  propQuestionCreatedSig,
} from "./abi";
import {
  provideHandleBlock,
  provideHandleTransaction
} from "./agent";
import {
  when,
  resetAllWhenMocks
} from "jest-when";

const testMsgSender: string = createAddress("0xda456f");
const testRealitioErc20: string = createAddress("0x2d5ef8");
const testDaoModule: string = createAddress("0xac689d");

const mockFetcher = {
  testRealitioErc20,
  getFinalizeTS: jest.fn()
}


describe("Cooldown Monitor Agent", () => {
  let handleBlock: HandleBlock;
  let handleTransaction: HandleTransaction;

  const prepareMockFetcher = (
    block: number,
    questionIds: string[],
    finalizeTSs: number[]
  ) => {
    if(questionIds.length === finalizeTSs.length) {
        for(let i = 0; i < questionIds.length; i++) {
          when(mockFetcher.getFinalizeTS)
            .calledWith(block, questionIds[i])
            .mockReturnValue(finalizeTSs[i]);
        }
    }
  };

  beforeEach(() => {
    resetAllWhenMocks();

    handleBlock = provideHandleBlock(
      mockFetcher as any
    );

    handleTransaction = provideHandleTransaction(
      testDaoModule
    );
  });

  it("should return a Finding from detecting when a question's cooldown starts", async () => {
    const testPropId: string = "d34d";
    const testQuestionId: string = "0x81d50202a3f5c3971f123d9ddcca9c2c91d3e863019bdc3de8fcc2480ffadf02";
    const testBlockNumber: number = 2256000;

    const testFinalizeTS: number = 1500000;

    const testTopics: string[] = [
      encodeParameters(["bytes32"], [testQuestionId]),
      encodeParameters(["string"], [testPropId])
    ];

    const testData: string = "0xd34db3ef"

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testDaoModule)
      .setTimestamp(testBlockNumber)
      .addEventLog(propQuestionCreatedSig, testDaoModule, testData, ...testTopics);

    await handleTransaction(txEvent);

    prepareMockFetcher(testBlockNumber, [testQuestionId], [testFinalizeTS]);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumber);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Cooldown Alert",
        description: "A question's cooldown period has begun",
        alertId: "SAFESNAP-2",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        protocol: "Gnosis SafeSnap",
        metadata: {
          questionId: testQuestionId,
          questionFinalizeTimeStamp: testFinalizeTS.toString(),
          blockNumber: testBlockNumber.toString()
        },
      })
    ]);
  });

  it("should return no Findings due to finalize timestamp being more than block number", async () => {
    const testPropId: string = "ab-12";
    const testQuestionId: string = "0x57c12963d94d1a2eec26eae9b064089728246725d507feb9e94a9703eb796a07";
    const testBlockNumber: number = 1000000;

    const testFinalizeTS: number = 1500000;

    const testTopics: string[] = [
      encodeParameters(["bytes32"], [testQuestionId]),
      encodeParameters(["string"], [testPropId])
    ];

    const testData: string = "0xf0ob4r"

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testDaoModule)
      .setTimestamp(testBlockNumber)
      .addEventLog(propQuestionCreatedSig, testDaoModule, testData, ...testTopics);

    await handleTransaction(txEvent);

    prepareMockFetcher(testBlockNumber, [testQuestionId], [testFinalizeTS]);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumber);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
    ]);
  });

  it("should return multiple Findings from detecting different questions' cooldowns", async () => {
    const testBlockNumber: number = 2000000;


    const testPropIdOne: string = "ac-23";
    const testQuestionIdOne: string = "0x81d50202a3f5c3971f123d9ddcca9c2c91d3e863019bdc3de8fcc2480ffadf02";

    const testFinalizeTSOne: number = 1500000;

    const testTopicsOne: string[] = [
      encodeParameters(["bytes32"], [testQuestionIdOne]),
      encodeParameters(["string"], [testPropIdOne])
    ];

    const testDataOne: string = "0x339da0";


    const testPropIdTwo: string = "ad-34";
    const testQuestionIdTwo: string = "0x57c12963d94d1a2eec26eae9b064089728246725d507feb9e94a9703eb796a07";

    const testFinalizeTSTwo: number = 1700000;

    const testTopicsTwo: string[] = [
      encodeParameters(["bytes32"], [testQuestionIdTwo]),
      encodeParameters(["string"], [testPropIdTwo])
    ];

    const testDataTwo: string = "0xad32f5";


    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testDaoModule)
      .setTimestamp(testBlockNumber)
      .addEventLog(propQuestionCreatedSig, testDaoModule, testDataOne, ...testTopicsOne)
      .addEventLog(propQuestionCreatedSig, testDaoModule, testDataTwo, ...testTopicsTwo);

    await handleTransaction(txEvent);

    prepareMockFetcher(
      testBlockNumber,
      [testQuestionIdOne, testQuestionIdTwo],
      [testFinalizeTSOne, testFinalizeTSTwo]
    );

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumber);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Cooldown Alert",
        description: "A question's cooldown period has begun",
        alertId: "SAFESNAP-2",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        protocol: "Gnosis SafeSnap",
        metadata: {
          questionId: testQuestionIdOne,
          questionFinalizeTimeStamp: testFinalizeTSOne.toString(),
          blockNumber: testBlockNumber.toString()
        },
      }),
      Finding.fromObject({
        name: "Cooldown Alert",
        description: "A question's cooldown period has begun",
        alertId: "SAFESNAP-2",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        protocol: "Gnosis SafeSnap",
        metadata: {
          questionId: testQuestionIdTwo,
          questionFinalizeTimeStamp: testFinalizeTSTwo.toString(),
          blockNumber: testBlockNumber.toString()
        },
      })
    ]);
  });

  it("should return one Finding even if transaciton includes multiple questionIds", async () => {
    const testBlockNumber: number = 2256000;


    const testPropIdOne: string = "ae-45";
    const testQuestionIdOne: string = "0x678e23012921e26c47439412244caa7bc94fed24e713c82d6cf16862911fe90e";

    const testFinalizeTSOne: number = 2500000;

    const testTopicsOne: string[] = [
      encodeParameters(["bytes32"], [testQuestionIdOne]),
      encodeParameters(["string"], [testPropIdOne])
    ];

    const testDataOne: string = "0x339da0";


    const testPropIdTwo: string = "af-56";
    const testQuestionIdTwo: string = "0x62ab2283734aa5a4c8cd78da2402b6a52316652fd22ad0629c361873de4ae0ff";

    const testFinalizeTSTwo: number = 1700000;

    const testTopicsTwo: string[] = [
      encodeParameters(["bytes32"], [testQuestionIdTwo]),
      encodeParameters(["string"], [testPropIdTwo])
    ];

    const testDataTwo: string = "0xad32f5";


    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testDaoModule)
      .setTimestamp(testBlockNumber)
      .addEventLog(propQuestionCreatedSig, testDaoModule, testDataOne, ...testTopicsOne)
      .addEventLog(propQuestionCreatedSig, testDaoModule, testDataTwo, ...testTopicsTwo);

    await handleTransaction(txEvent);

    prepareMockFetcher(
      testBlockNumber,
      [testQuestionIdOne, testQuestionIdTwo],
      [testFinalizeTSOne, testFinalizeTSTwo]
    );

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumber);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Cooldown Alert",
        description: "A question's cooldown period has begun",
        alertId: "SAFESNAP-2",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        protocol: "Gnosis SafeSnap",
        metadata: {
          questionId: testQuestionIdTwo,
          questionFinalizeTimeStamp: testFinalizeTSTwo.toString(),
          blockNumber: testBlockNumber.toString()
        },
      })
    ]);
  });

});
