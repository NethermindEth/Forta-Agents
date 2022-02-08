import {
  HandleTransaction,
  TransactionEvent
} from "forta-agent";
import { 
  createAddress,
  TestTransactionEvent,
  encodeParameters,
  TraceProps
} from "forta-agent-tools";
import {
  utils,
  BigNumber
} from "ethers";
import {
  provideHandleTransaction,
  createFinding,
  setFuncAbi,
  setFuncSig
} from "./agent";

const testMsgSender: string = createAddress("0xcd85bf43");

const testTimelockContract: string = createAddress("0x9ed32ff");
const testBscPool: string = createAddress("0xf974dca");

const queueTxnEventSig: string = "QueueTransaction(bytes32,address,uint256,string,bytes,uint256)";

const testSetIFace = new utils.Interface([setFuncAbi]);

describe("AllocPoint Change Alert Agent", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(testTimelockContract, testBscPool);
  })

  it("should return a Finding from QueueTransaction event emission in Timelock contract", async () => {
    const testTxHash: string = "0x0000000000000000000000000000000000000000000000000000000000ab4d23";
    const testStakingContract: string = createAddress("0x8c463a");

    const testTopics: string[] = [
      encodeParameters(["bytes32"], [testTxHash]),
      encodeParameters(["address"], [testStakingContract])
    ];

    const testValue: BigNumber = BigNumber.from("1000000000000000000");  // 1.0

    const testPoolId: number = 123;
    const testAllocPoint: number = 321;
    const testEta: number = 14000000;
    const testWithUpdate: boolean = false;

    const testSetArguments: any[] = [testPoolId, testAllocPoint, testWithUpdate];

    const mockEncodedSetFuncCall: string = encodeParameters(
      ["uint256", "uint256", "bool"],
      testSetArguments
    );

    const testData: string = encodeParameters(
      ["uint256", "string", "bytes", "uint256"],
      [testValue, setFuncSig, mockEncodedSetFuncCall, testEta]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testTimelockContract)
      .addEventLog(queueTxnEventSig, testTimelockContract, testData, ...testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        testPoolId,
        testAllocPoint,
        testWithUpdate,
        testStakingContract
      )
    ]);
  });

  it("should return muiltiple Findings from QueueTransaction event emission in Timelock contract", async () => {
    const testTxHash: string = "0x0000000000000000000000000000000000000000000000000000000000fe9cd4";
    const testStakingContract: string = createAddress("0xd42fda");

    const testTopics: string[] = [
      encodeParameters(["bytes32"], [testTxHash]),
      encodeParameters(["address"], [testStakingContract])
    ];

    const testValue: BigNumber = BigNumber.from("17000000000000000000");  // 17

    const testPoolId: number = 258;
    const testAllocPoint: number = 852;
    const testEta: number = 23300000;
    const testWithUpdate: boolean = false;

    const testSetArguments: any[] = [testPoolId, testAllocPoint, testWithUpdate];

    const mockEncodedSetFuncCall: string = encodeParameters(
      ["uint256", "uint256", "bool"],
      testSetArguments
    );

    const testData: string = encodeParameters(
      ["uint256", "string", "bytes", "uint256"],
      [testValue, setFuncSig, mockEncodedSetFuncCall, testEta]
    );

    const testTxHashTwo: string = "0x0000000000000000000000000000000000000000000000000000000000e97ab6";
    const testStakingContractTwo: string = createAddress("0xde432a");

    const testTopicsTwo: string[] = [
      encodeParameters(["bytes32"], [testTxHashTwo]),
      encodeParameters(["address"], [testStakingContractTwo])
    ];

    const testValueTwo: BigNumber = BigNumber.from("23000000000000000000");  // 23

    const testPoolIdTwo: number = 658;
    const testAllocPointTwo: number = 856;
    const testEtaTwo: number = 71300000;
    const testWithUpdateTwo: boolean = true;

    const testSetArgumentsTwo: any[] = [testPoolIdTwo, testAllocPointTwo, testWithUpdateTwo];

    const mockEncodedSetFuncCallTwo: string = encodeParameters(
      ["uint256", "uint256", "bool"],
      testSetArgumentsTwo
    );

    const testDataTwo: string = encodeParameters(
      ["uint256", "string", "bytes", "uint256"],
      [testValueTwo, setFuncSig, mockEncodedSetFuncCallTwo, testEtaTwo]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testTimelockContract)
      .addEventLog(queueTxnEventSig, testTimelockContract, testData, ...testTopics)
      .addEventLog(queueTxnEventSig, testTimelockContract, testDataTwo, ...testTopicsTwo);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        testPoolId,
        testAllocPoint,
        testWithUpdate,
        testStakingContract
      ),
      createFinding(
        testPoolIdTwo,
        testAllocPointTwo,
        testWithUpdateTwo,
        testStakingContractTwo
      )
    ]);
  });

  it("should return no Findings from QueueTransaction due to incorrect QueueTransanction event signature", async () => {
    const badQueueTxnSig: string = "badSig";

    const testTxHash: string = "0x0000000000000000000000000000000000000000000000000000000000fe73b2";
    const testStakingContract: string = createAddress("0x460b3f");

    const testTopics: string[] = [
      encodeParameters(["bytes32"], [testTxHash]),
      encodeParameters(["address"], [testStakingContract])
    ];

    const testValue: BigNumber = BigNumber.from("15000000000000000000");  // 15

    const testPoolId: number = 456;
    const testAllocPoint: number = 654;
    const testEta: number = 28000000;
    const testWithUpdate: boolean = true;

    const testSetArguments: any[] = [testPoolId, testAllocPoint, testWithUpdate];

    const mockEncodedSetFuncCall: string = encodeParameters(
      ["uint256", "uint256", "bool"],
      testSetArguments
    );

    const testData: string = encodeParameters(
      ["uint256", "string", "bytes", "uint256"],
      [testValue, setFuncSig, mockEncodedSetFuncCall, testEta]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testTimelockContract)
      .addEventLog(badQueueTxnSig, testTimelockContract, testData, ...testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings from QueueTransaction due to incorrect Timelock address", async () => {
    const badTimelockAddress: string = createAddress("badAddress");

    const testTxHash: string = "0x0000000000000000000000000000000000000000000000000000000000da3d72";
    const testStakingContract: string = createAddress("0x898ec8");

    const testTopics: string[] = [
      encodeParameters(["bytes32"], [testTxHash]),
      encodeParameters(["address"], [testStakingContract])
    ];

    const testValue: BigNumber = BigNumber.from("73000000000000000000");  // 73

    const testPoolId: number = 789;
    const testAllocPoint: number = 987;
    const testEta: number = 36000000;
    const testWithUpdate: boolean = false;

    const testSetArguments: any[] = [testPoolId, testAllocPoint, testWithUpdate];

    const mockEncodedSetFuncCall: string = encodeParameters(
      ["uint256", "uint256", "bool"],
      testSetArguments
    );

    const testData: string = encodeParameters(
      ["uint256", "string", "bytes", "uint256"],
      [testValue, setFuncSig, mockEncodedSetFuncCall, testEta]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(badTimelockAddress)
      .addEventLog(queueTxnEventSig, badTimelockAddress, testData, ...testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings from QueueTransaction due to incorrect Set function signature", async () => {
    const badSetFuncSig: string = 'badSig';

    const testTxHash: string = "0x0000000000000000000000000000000000000000000000000000000000ef839d";
    const testStakingContract: string = createAddress("0x73e33d");

    const testTopics: string[] = [
      encodeParameters(["bytes32"], [testTxHash]),
      encodeParameters(["address"], [testStakingContract])
    ];

    const testValue: BigNumber = BigNumber.from("56000000000000000000");  // 56

    const testPoolId: number = 369;
    const testAllocPoint: number = 963;
    const testEta: number = 67200000;
    const testWithUpdate: boolean = true;

    const testSetArguments: any[] = [testPoolId, testAllocPoint, testWithUpdate];

    const mockEncodedSetFuncCall: string = encodeParameters(
      ["uint256", "uint256", "bool"],
      testSetArguments
    );

    const testData: string = encodeParameters(
      ["uint256", "string", "bytes", "uint256"],
      [testValue, badSetFuncSig, mockEncodedSetFuncCall, testEta]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testTimelockContract)
      .addEventLog(queueTxnEventSig, testTimelockContract, testData, ...testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a Finding from Set function call", async () => {
    const testPoolId: number = 258;
    const testAllocPoint: number = 852;
    const testWithUpdate: boolean = false;

    const testSetArguments: any[] = [testPoolId, testAllocPoint, testWithUpdate];

    const testEncodedSetFuncCall: string = testSetIFace.encodeFunctionData("set", testSetArguments);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testBscPool)
      .setData(testEncodedSetFuncCall)

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        testPoolId,
        testAllocPoint,
        testWithUpdate,
        testBscPool
      )
    ]);
  });

  it("should return multiple Findings from Set function calls", async () => {
    const testPoolId: number = 258;
    const testAllocPoint: number = 852;
    const testWithUpdate: boolean = false;

    const testSetArguments: any[] = [testPoolId, testAllocPoint, testWithUpdate];

    const testEncodedSetFuncCall: string = testSetIFace.encodeFunctionData("set", testSetArguments);

    const tracePropsOne: TraceProps[] = [{
      to: testBscPool,
      from: testMsgSender,
      input: testEncodedSetFuncCall
    }];

    const testPoolIdTwo: number = 145;
    const testAllocPointTwo: number = 541;
    const testWithUpdateTwo: boolean = true;

    const testSetArgumentsTwo: any[] = [testPoolIdTwo, testAllocPointTwo, testWithUpdateTwo];

    const testEncodedSetFuncCallTwo: string = testSetIFace.encodeFunctionData("set", testSetArgumentsTwo);

    const traceProps: TraceProps[] = [{
      to: testBscPool,
      from: testMsgSender,
      input: testEncodedSetFuncCallTwo
    }];

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testBscPool)
      .addTraces(...tracePropsOne)
      .addTraces(...traceProps);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        testPoolId,
        testAllocPoint,
        testWithUpdate,
        testBscPool
      ),
      createFinding(
        testPoolIdTwo,
        testAllocPointTwo,
        testWithUpdateTwo,
        testBscPool
      )
    ]);
  });

  it("should return no Findings due to incorrect Set function abi", async () => {
    const testPoolId: number = 987;

    const updatePoolAbi: string = "function updatePool(uint256 _pid)";
    const updatePoolIFace = new utils.Interface([updatePoolAbi]);
    const testEncodedUpdatePoolFuncCall: string = updatePoolIFace.encodeFunctionData("updatePool", [testPoolId]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testBscPool)
      .setData(testEncodedUpdatePoolFuncCall);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
})
