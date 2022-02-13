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
  encodeParameter
} from "forta-agent-tools";
import {
  propQuestionCreatedSig,
  getFinalizeTSIface
} from "./abi";
import {
  provideHandleBlock,
  provideHandleTransaction,
  getFinalizeTS,
  testQuestionId
} from "./agent";
import {
  when,
  resetAllWhenMocks
} from "jest-when";
import {
  utils,
  BigNumber,
} from "ethers";

const testMsgSender: string = createAddress("0xda456f");
const testRealitioErc20: string = createAddress("0x2d5ef8");
const testDaoModule: string = createAddress("0xac689d");
// const testQuestionId: string = utils.formatBytes32String("Is this a test?");
const testFinalizeTS: number = 4000;

const mockCall = jest.fn();
const mockEthers = {
  call: mockCall,
  _isProvider: true, // Necessary for being an ethers provider
} as any;

const isCallMethod = (
  data: string,
  contractInterface: utils.Interface,
  functionName: string
): boolean => {
  const selector = data.slice(0, 10);
  return selector === contractInterface.getSighash(functionName);
};

const isCallToGetFinalizeTS = (questionId: string) => {
  return true;
  /*
  when(
    ({ data, to}) => {
      console.log("passed { data, to } check");
      isCallMethod(data, getFinalizeTSIface, "getFinalizeTS") &&
      to.toLowerCase() === testRealitioErc20.toLowerCase() &&
      questionId === testQuestionId.toLowerCase()
      
    }
  );
  */
}


describe("Cooldown Monitor Agent", () => {
  let handleBlock: HandleBlock;
  let handleTransaction: HandleTransaction;

  beforeEach(() => {
    resetAllWhenMocks();

    handleBlock = provideHandleBlock(
      testRealitioErc20,
      mockEthers
    );

    handleTransaction = provideHandleTransaction(
      testDaoModule
    );

    when(mockCall)
      // .calledWith(isCallToGetFinalizeTS(testQuestionId), expect.anything())
      .calledWith(getFinalizeTS(testRealitioErc20, mockEthers, 1256000, testQuestionId)) // NOTE: ONLY USING THIS FOR TESTING
      .mockReturnValue(testFinalizeTS);
  });

  it("should return a Finding from detecting when a question's cooldown starts", async () => {
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

    await handleTransaction(txEvent);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(1256000)

    const findings: Finding[] = await handleBlock(blockEvent);

    /*
    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Cooldown Alert",
        description: "A question's cooldown period has begun",
        alertId: "GNOSIS-2",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        protocol: "Gnosis SafeSnap",
        metadata: {
          questionId: testQuestionId,
          questionFinalizeTimeStamp: testFinalizeTS.toString(),
          blockNumber: "1256000"
        },
      })
    ]);
    */
  });
})
