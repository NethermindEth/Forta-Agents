import {
  HandleTransaction,
  TransactionEvent
} from "forta-agent";
import { 
  createAddress,
  TestTransactionEvent,
  encodeParameters
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

const testMsgSender: string = createAddress("0xcD85bf43");

const testTimelockContract: string = createAddress("0x9eD32fF");
const testBscPool: string = createAddress("0xF974Dca");
const testPoolControllers: string[] = [testTimelockContract, testBscPool].map(address => address.toLowerCase());

const queueTxnEventSig: string = "QueueTransaction(bytes32,address,uint256,string,bytes,uint256)";

const testSetIFace = new utils.Interface([setFuncAbi]);

describe("AllocPoint Change Alert Agent", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(testPoolControllers);
  })

  it("should return a Finding from QueueTransaction event emission in Timelock contract", async () => {
    const testTxHash: string = "0x0000000000000000000000000000000000000000000000000000000000aB4D23";
    const testStakingContract: string = "0xcC6699821f04906d1a3142F612fbb3AC8a8c463a";

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

  it("should return no Findings from QueueTransaction due to incorrect QueueTransanction event signature", async () => {
    const badQueueTxnSig: string = "badSig";

    const testTxHash: string = "0x0000000000000000000000000000000000000000000000000000000000fE73b2";
    const testStakingContract: string = "0x8E37f666e9198136a5A979954C12e16639460b3f";

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

    const testTxHash: string = "0x0000000000000000000000000000000000000000000000000000000000dA3d72";
    const testStakingContract: string = "0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8";

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

    const testTxHash: string = "0x0000000000000000000000000000000000000000000000000000000000eF839d";
    const testStakingContract: string = "0xA96d374262272675da83ca4Bf1DCC7BF9273e33D";

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

  it("should return multiple Findings from both Set function call and QueueTransaction event emission", async () => {
    const testTxHash: string = "0x0000000000000000000000000000000000000000000000000000000000d34Dfe";
    const testStakingContract: string = "0xEb55a78C79b91719F6817855c5AD43a7aA0BF08C";

    const testTopics: string[] = [
      encodeParameters(["bytes32"], [testTxHash]),
      encodeParameters(["address"], [testStakingContract])
    ];

    const testValue: BigNumber = BigNumber.from("38000000000000000000");  // 38

    const testPoolId: number = 147;
    const testAllocPoint: number = 741;
    const testEta: number = 32300000;
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
      .addEventLog(queueTxnEventSig, testTimelockContract, testData, ...testTopics);

    const findings = await handleTransaction(txEvent);


    const testPoolIdTwo: number = 753;
    const testAllocPointTwo: number = 357;
    const testWithUpdateTwo: boolean = false;

    const testSetArgumentsTwo: any[] = [testPoolIdTwo, testAllocPointTwo, testWithUpdateTwo];

    const testEncodedSetFuncCall: string = testSetIFace.encodeFunctionData("set", testSetArgumentsTwo);

    const txEventTwo: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testBscPool)
      .setData(testEncodedSetFuncCall)

    findings.push(...await handleTransaction(txEventTwo));

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
        testBscPool
      )
    ]);
  });
})
