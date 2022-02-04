import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent
} from "forta-agent";
import { 
  createAddress,
  TestTransactionEvent,
  encodeParameters
} from "forta-agent-tools";
import {
  utils
} from "ethers";
import {
  provideHandleTransaction,
  setFuncAbi,
  setFuncSig
} from "./agent";

const testMsgSender: string = createAddress("0x1234");

const testTimelockContract: string = createAddress("0x172839456");
const testBscPool: string = createAddress("0x543678");
const testPoolControllers: string[] = [testTimelockContract, testBscPool]

// Arguments for a test call to set()
const testPoolId: number = 123;
const testAllocPoint: number = 321;
const testWithUpdate: boolean = true;

const testSetArguments: any[] = [testPoolId, testAllocPoint, testWithUpdate];

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Test QueueTransaction Event Data ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ \\
const mockEncodedSetFuncCall: string = encodeParameters(
  ["uint256", "uint256", "bool"],
  testSetArguments
);

const queueTxnEventSig: string = "QueueTransaction(bytes32,address,uint256,string,bytes,uint256)";

const testTxHash: string = "0x0000000000000000000000000000000000000000000000000000000000000023";
const testStakingContract: string = createAddress("0x987654321");
const testValue: bigint = BigInt(1000000000000000000);    // 1.0
const testEta: number = 14000000;

const testTopics: string[] = [
  encodeParameters(["bytes32"], [testTxHash]),
  encodeParameters(["address"], [testStakingContract])
];

const testData: string = encodeParameters(
  ["uint256", "string", "bytes", "uint256"],
  [testValue, setFuncSig, mockEncodedSetFuncCall, testEta]
);
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ \\

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Test Set Function Data ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ \\
const testIFace = new utils.Interface([setFuncAbi])
const testEncodedSetFuncCall: string = testIFace.encodeFunctionData("set", testSetArguments);
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ \\

describe("AllocPoint Change Alert Agent", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(testPoolControllers);
  })

  it("should return a Finding from QueueTransaction event emission in Timelock contract", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testTimelockContract)
      .addEventLog(queueTxnEventSig, testTimelockContract, testData, ...testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "AllocPoint Change Event",
        description: "Pool's alloc point queued for update.",
        alertId: "ALPACA-6",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata:{
          poolId: testPoolId.toString(),
          allocPoint: testAllocPoint.toString(),
          withUpdate: testWithUpdate.toString(),
          target: testStakingContract
        }
      }),
    ]);
  });

  it("should return no Findings from QueueTransaction due to incorrect QueueTransanction event signature", async () => {
    const badQueueTxnSig: string = 'badSig';

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testTimelockContract)
      .addEventLog(badQueueTxnSig, testTimelockContract, testData, ...testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings from QueueTransaction due to incorrect Timelock address", async () => {
    const badTimelockAddress: string = createAddress("badAddress");

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(badTimelockAddress)
      .addEventLog(queueTxnEventSig, badTimelockAddress, testData, ...testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings from QueueTransaction due to incorrect Set function signature", async () => {
    const badSetFuncSig: string = 'badSig';

    const pcsBadData: string = encodeParameters(
      ["uint256", "string", "bytes", "uint256"],
      [testValue, badSetFuncSig, mockEncodedSetFuncCall, testEta]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testTimelockContract)
      .addEventLog(queueTxnEventSig, testTimelockContract, pcsBadData, ...testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a Finding from Set function call from Mdex", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testBscPool)
      .setData(testEncodedSetFuncCall)

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "AllocPoint Change Event",
        description: "Pool's alloc point queued for update.",
        alertId: "ALPACA-6",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata:{
          poolId: testPoolId.toString(),
          allocPoint: testAllocPoint.toString(),
          withUpdate: testWithUpdate.toString(),
          target: testBscPool
        }
      }),
    ])
  });

  it("should return no Findings from Mdex due to incorrect function abi", async () => {
    const badPoolId: number = 987;

    const mdexUpdatePoolAbi: string = "function updatePool(uint256 _pid)";
    const badMdexIFace = new utils.Interface([mdexUpdatePoolAbi])
    const badEncodedUpdatePoolFuncCall: string = badMdexIFace.encodeFunctionData("updatePool", [badPoolId]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testBscPool)
      .setData(badEncodedUpdatePoolFuncCall)

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
})
