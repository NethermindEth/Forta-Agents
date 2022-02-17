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
  MockEthersProvider,
  runBlock
} from "forta-agent-tools";
import {
  propQuestionCreatedSig,
  moduleIFace,
  oracleIFace
} from "./abi";
import {
  provideInitialize,
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

const mockFetcher = {
  testModule,
  getOracle: jest.fn(),
  getFinalizeTS: jest.fn()
}

const mockProvider: MockEthersProvider = new MockEthersProvider();

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

    handleBlock = provideHandleBlock();

    handleTransaction = provideHandleTransaction(
      testModule 
    );
  });

  it("should return a Finding from detecting when a question's cooldown starts", async () => {
    const testPropId: string = "aa-11";
    const testQuestionId: string = "0x81d50202a3f5c3971f123d9ddcca9c2c91d3e863019bdc3de8fcc2480ffadf02";
    const testBlockNumber: number = 2256000;

    const testFinalizeTS: number = 1500000;

    const testTopics: string[] = [
      encodeParameters(["bytes32"], [testQuestionId]),
      encodeParameters(["string"], [testPropId])
    ];

    const testData: string = "0xd34db3ef";

    // NOTE: COULDN'T GET IT TO WORK
    // BY SETTING ITS TYPE TO Initialize
    // FROM THE SDK
    provideInitialize(
      testModule,
      mockProvider as any
    );

    mockProvider.addCallTo(
      testModule, testBlockNumber, moduleIFace,
      "oracle",
      { inputs:[], outputs:[testOracle] },
    );
    mockProvider.addCallTo(
      testOracle, testBlockNumber, oracleIFace,
      "getFinalizeTS",
      { inputs:[testQuestionId], outputs:[testFinalizeTS] },
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testModule)
      .setTimestamp(testBlockNumber)
      .addEventLog(propQuestionCreatedSig, testModule, testData, ...testTopics);

    // NOTE: STILL HAD TO HAVE THIS SINCE I NEED TO
    // HANDLE A TRANSACTION TO PROVIDE THE questionIds
    // ARRAY WITH ITEMS
    // await handleTransaction(txEvent);

    prepareMockFetcher(testBlockNumber, testOracle, [testQuestionId], [testFinalizeTS]);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumber);

    const findings: Finding[] = await runBlock(
      {
        handleBlock: handleBlock,
        handleTransaction: handleTransaction
      },
      blockEvent,
      txEvent
    );

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

  /*
  it("should return no Findings due to finalize timestamp being more than block number", async () => {
    const testPropId: string = "ab-12";
    const testQuestionId: string = "0x57c12963d94d1a2eec26eae9b064089728246725d507feb9e94a9703eb796a07";
    const testBlockNumber: number = 1000000;

    const testFinalizeTS: number = 1500000;

    const testTopics: string[] = [
      encodeParameters(["bytes32"], [testQuestionId]),
      encodeParameters(["string"], [testPropId])
    ];

    const testData: string = "0xf0ob4r";

    // NOTE: COULDN'T GET IT TO WORK
    // BY SETTING ITS TYPE TO Initialize
    // FROM THE SDK
    provideInitialize(
      testModule,
      mockProvider as any
    );

    mockProvider.addCallTo(
      testModule, testBlockNumber, moduleIFace,
      "oracle",
      { inputs:[], outputs:[testOracle] },
    );
    mockProvider.addCallTo(
      testOracle, testBlockNumber, oracleIFace,
      "getFinalizeTS",
      { inputs:[testQuestionId], outputs:[testFinalizeTS] },
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testModule)
      .setTimestamp(testBlockNumber)
      .addEventLog(propQuestionCreatedSig, testModule, testData, ...testTopics);

    // NOTE: STILL HAD TO HAVE THIS SINCE I NEED TO
    // HANDLE A TRANSACTION TO PROVIDE THE questionIds
    // ARRAY WITH ITEMS
    await handleTransaction(txEvent);

    prepareMockFetcher(testBlockNumber, testOracle, [testQuestionId], [testFinalizeTS]);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumber);

    const findings: Finding[] = await runBlock(
      {
        handleBlock: handleBlock,
        handleTransaction: handleTransaction
      },
      blockEvent,
      txEvent
    );

    expect(findings).toStrictEqual([
    ]);
  });

  it("should return multiple Findings from detecting cooldowns from different questions", async () => {
    const testBlockNumber: number = 2000000;


    const testPropIdOne: string = "ac-23";
    const testQuestionIdOne: string = "0x080f91de22bcdcd395d9f59ad1eb7d2bd851213f36ce88eee1b3321a275c8c2c";

    const testFinalizeTSOne: number = 1500000;

    const testTopicsOne: string[] = [
      encodeParameters(["bytes32"], [testQuestionIdOne]),
      encodeParameters(["string"], [testPropIdOne])
    ];

    const testDataOne: string = "0x339da0";


    const testPropIdTwo: string = "ad-34";
    const testQuestionIdTwo: string = "0x678e23012921e26c47439412244caa7bc94fed24e713c82d6cf16862911fe90e";

    const testFinalizeTSTwo: number = 1700000;

    const testTopicsTwo: string[] = [
      encodeParameters(["bytes32"], [testQuestionIdTwo]),
      encodeParameters(["string"], [testPropIdTwo])
    ];

    const testDataTwo: string = "0xad32f5";

    // NOTE: COULDN'T GET IT TO WORK
    // BY SETTING ITS TYPE TO Initialize
    // FROM THE SDK
    provideInitialize(
      testModule,
      mockProvider as any
    );

    mockProvider.addCallTo(
      testModule, testBlockNumber, moduleIFace,
      "oracle",
      { inputs:[], outputs:[testOracle] },
    );
    mockProvider.addCallTo(
      testOracle, testBlockNumber, oracleIFace,
      "getFinalizeTS",
      { inputs:[testQuestionIdOne], outputs:[testFinalizeTSOne] },
    );
    mockProvider.addCallTo(
      testOracle, testBlockNumber, oracleIFace,
      "getFinalizeTS",
      { inputs:[testQuestionIdTwo], outputs:[testFinalizeTSTwo] },
    );


    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testModule)
      .setTimestamp(testBlockNumber)
      .addEventLog(propQuestionCreatedSig, testModule, testDataOne, ...testTopicsOne)
      .addEventLog(propQuestionCreatedSig, testModule, testDataTwo, ...testTopicsTwo);

    // NOTE: STILL HAD TO HAVE THIS SINCE I NEED TO
    // HANDLE A TRANSACTION TO PROVIDE THE questionIds
    // ARRAY WITH ITEMS
    await handleTransaction(txEvent);

    prepareMockFetcher(
      testBlockNumber,
      testOracle,
      [testQuestionIdOne, testQuestionIdTwo],
      [testFinalizeTSOne, testFinalizeTSTwo]
    );

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumber);

    const findings: Finding[] = await runBlock(
      {
        handleBlock: handleBlock,
        handleTransaction: handleTransaction
      },
      blockEvent,
      txEvent
    );

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
    const testQuestionIdOne: string = "0x2fe16d1c3df69c437f73c27c37eaec4f488af69c101429817eb381cfa7416ac7";

    const testFinalizeTSOne: number = 2500000;

    const testTopicsOne: string[] = [
      encodeParameters(["bytes32"], [testQuestionIdOne]),
      encodeParameters(["string"], [testPropIdOne])
    ];

    const testDataOne: string = "0x339da0";


    const testPropIdTwo: string = "af-56";
    const testQuestionIdTwo: string = "0xc071094ab7ce9b9a69f4e4312a66f6774dd296cfae05204a3f3ba0a9ef424487";

    const testFinalizeTSTwo: number = 1700000;

    const testTopicsTwo: string[] = [
      encodeParameters(["bytes32"], [testQuestionIdTwo]),
      encodeParameters(["string"], [testPropIdTwo])
    ];

    const testDataTwo: string = "0xad32f5";

    // NOTE: COULDN'T GET IT TO WORK
    // BY SETTING ITS TYPE TO Initialize
    // FROM THE SDK
    provideInitialize(
      testModule,
      mockProvider as any
    );

    mockProvider.addCallTo(
      testModule, testBlockNumber, moduleIFace,
      "oracle",
      { inputs:[], outputs:[testOracle] },
    );
    mockProvider.addCallTo(
      testOracle, testBlockNumber, oracleIFace,
      "getFinalizeTS",
      { inputs:[testQuestionIdOne], outputs:[testFinalizeTSOne] },
    );
    mockProvider.addCallTo(
      testOracle, testBlockNumber, oracleIFace,
      "getFinalizeTS",
      { inputs:[testQuestionIdTwo], outputs:[testFinalizeTSTwo] },
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testModule)
      .setTimestamp(testBlockNumber)
      .addEventLog(propQuestionCreatedSig, testModule, testDataOne, ...testTopicsOne)
      .addEventLog(propQuestionCreatedSig, testModule, testDataTwo, ...testTopicsTwo);

    // NOTE: STILL HAD TO HAVE THIS SINCE I NEED TO
    // HANDLE A TRANSACTION TO PROVIDE THE questionIds
    // ARRAY WITH ITEMS
    await handleTransaction(txEvent);

    prepareMockFetcher(
      testBlockNumber,
      testOracle,
      [testQuestionIdOne, testQuestionIdTwo],
      [testFinalizeTSOne, testFinalizeTSTwo]
    );

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlockNumber);

    const findings: Finding[] = await runBlock(
      {
        handleBlock: handleBlock,
        handleTransaction: handleTransaction
      },
      blockEvent,
      txEvent
    );

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
  */
});
