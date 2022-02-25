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
const testOracle: string = createAddress("0x2d5ef8");
const testModule: string = createAddress("0xac689d");
const testBlockNumber: number = 2256000;

const testPropIds: string[] = [
  "aa-11",
  "ab-12",
  "ac-23",
  "ad-34",
  "ae-45",
  "af-56"
];
const testQuestionIds: string[] = [
  "0x81d50202a3f5c3971f123d9ddcca9c2c91d3e863019bdc3de8fcc2480ffadf02",
  "0x57c12963d94d1a2eec26eae9b064089728246725d507feb9e94a9703eb796a07",
  "0x080f91de22bcdcd395d9f59ad1eb7d2bd851213f36ce88eee1b3321a275c8c2c",
  "0x678e23012921e26c47439412244caa7bc94fed24e713c82d6cf16862911fe90e",
  "0x2fe16d1c3df69c437f73c27c37eaec4f488af69c101429817eb381cfa7416ac7",
  "0xc071094ab7ce9b9a69f4e4312a66f6774dd296cfae05204a3f3ba0a9ef424487"
]
const testFinalizeTSs: number[] = [
  1500000,
  2500000,
  1600000,
  1700000,
  2800000,
  1800000
];
const testData: string[] = [
  "0xd34db3ef",
  "0xf0ob4r",
  "0x339da0",
  "0xad32f5",
  "0x339da0",
  "0xad32f5"
];

function createTestTopics(questionId: string, propId: string): string[] {
  return [
    encodeParameters(["bytes32"], [questionId]),
    encodeParameters(["string"], [propId])
  ];
}

function createFinding(id: string, finalizeTs: number, block: number): Finding {
  return Finding.fromObject({
    name: "SafeSnap Cooldown Alert",
    description: "A question's cooldown period has begun",
    alertId: "SAFESNAP-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    protocol: "Gnosis SafeSnap",
    metadata: {
      questionId: id,
      questionFinalizeTimeStamp: finalizeTs.toString(),
      blockNumber: block.toString()
    },
  });
};

const testFilteredQuestionIds: string[] = [];

const mockFetcher = {
  testModule,
  getOracle: jest.fn(),
  getFinalizeTS: jest.fn()
}

describe("Cooldown Monitor Agent", () => {
  let handleBlock: HandleBlock;
  let handleTransaction: HandleTransaction;

  const prepareMockFetcher = (
    block: number,
    oracleAddress: string,
    questionIds: string[],
    finalizeTSs: number[]
  ) => {
    if(questionIds.length === finalizeTSs.length) {
        for(let i = 0; i < questionIds.length; i++) {
          when(mockFetcher.getFinalizeTS)
            .calledWith(block, oracleAddress, questionIds[i])
            .mockReturnValue(finalizeTSs[i]);
        }
    }
  };

  beforeEach(() => {
    resetAllWhenMocks();

    handleTransaction = provideHandleTransaction(
      testModule,
      testFilteredQuestionIds
    );

    handleBlock = provideHandleBlock(
      mockFetcher as any,
      testOracle,
      testFilteredQuestionIds
    );
  });

  it("should return a Finding from detecting when a question's cooldown starts", async () => {
    const testTopics: string[] = createTestTopics(testQuestionIds[0], testPropIds[0]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testModule)
      .setTimestamp(testBlockNumber)
      .addEventLog(propQuestionCreatedSig, testModule, testData[0], ...testTopics);

    await handleTransaction(txEvent);

    prepareMockFetcher(testBlockNumber, testOracle, [testQuestionIds[0]], [testFinalizeTSs[0]]);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumber);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([createFinding(
      testQuestionIds[0],
      testFinalizeTSs[0],
      testBlockNumber,
    )]);
  });

  it("should return no Findings due to finalize timestamp being more than block number", async () => {
    const testTopics: string[] = createTestTopics(testQuestionIds[1], testPropIds[1]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testModule)
      .setTimestamp(testBlockNumber)
      .addEventLog(propQuestionCreatedSig, testModule, testData[1], ...testTopics);

    await handleTransaction(txEvent);

    prepareMockFetcher(testBlockNumber, testOracle, [testQuestionIds[1]], [testFinalizeTSs[1]]);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumber);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return multiple Findings from detecting cooldowns from different questions", async () => {
    const testTopicsOne: string[] = createTestTopics(testQuestionIds[2], testPropIds[2]);
    const testTopicsTwo: string[] = createTestTopics(testQuestionIds[3], testPropIds[3]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testModule)
      .setTimestamp(testBlockNumber)
      .addEventLog(propQuestionCreatedSig, testModule, testData[2], ...testTopicsOne)
      .addEventLog(propQuestionCreatedSig, testModule, testData[3], ...testTopicsTwo);

    await handleTransaction(txEvent);

    prepareMockFetcher(
      testBlockNumber,
      testOracle,
      [testQuestionIds[2], testQuestionIds[3]],
      [testFinalizeTSs[2], testFinalizeTSs[3]]
    );

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumber);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(testQuestionIds[2], testFinalizeTSs[2], testBlockNumber),
      createFinding(testQuestionIds[3], testFinalizeTSs[3], testBlockNumber),
    ]);
  });

  it("should return one Finding even if transaciton includes multiple questionIds", async () => {
    const testTopicsOne: string[] = createTestTopics(testQuestionIds[4], testPropIds[4]);
    const testTopicsTwo: string[] = createTestTopics(testQuestionIds[5], testPropIds[5]);
    
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testModule)
      .setTimestamp(testBlockNumber)
      .addEventLog(propQuestionCreatedSig, testModule, testData[4], ...testTopicsOne)
      .addEventLog(propQuestionCreatedSig, testModule, testData[5], ...testTopicsTwo);

    await handleTransaction(txEvent);

    prepareMockFetcher(
      testBlockNumber,
      testOracle,
      [testQuestionIds[4], testQuestionIds[5]],
      [testFinalizeTSs[4], testFinalizeTSs[5]]
    );

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumber);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(testQuestionIds[5], testFinalizeTSs[5], testBlockNumber),
    ]);
  });
});