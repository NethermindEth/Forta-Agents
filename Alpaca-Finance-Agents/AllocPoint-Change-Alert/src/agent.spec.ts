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
  provideHandleTransaction
} from "./agent";

const testMsgSender: string = createAddress("0x1234");

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Test PancakeSwap Data ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ \\
const testLpAddress: string = createAddress("0x321987456");
// Arguments for a test call to set()
const testPoolId: number = 123;
const testAllocPoint: number = 321;
const testWithUpdate: boolean = true;
// Encoded arguments for set() function call
const encodedSetFuncCall: string = encodeParameters(
  ["uint256", "uint256", "bool"],
  [testPoolId, testAllocPoint, testWithUpdate]
);

const testAddressMap: Map<number, string> = new Map([[testPoolId, testLpAddress]]);
const queueTxnEventSig: string = "QueueTransaction(bytes32,address,uint256,string,bytes,uint256)";
const pcsSetFuncSig: string = "set(uint256,uint256,bool)";

const testTimelockContract: string = createAddress("0x172839456")
const testTxHash: string = "0x0000000000000000000000000000000000000000000000000000000000000023";
const testStakingContract: string = createAddress("0x987654321");
const testValue: bigint = BigInt(1000000000000000000);    // 1.0
const testEta: number = 14000000;

const pcsTopics: string[] = [
  encodeParameters(["bytes32"], [testTxHash]),
  encodeParameters(["address"], [testStakingContract])
];

const pcsData: string = encodeParameters(
  ["uint256", "string", "bytes", "uint256"],
  [testValue, pcsSetFuncSig, encodedSetFuncCall, testEta]
);
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ \\

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Test MDEX Data ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ \\
const testBoardRoomMdx: string = createAddress("0x543678");
const testMdexLpAddress: string = createAddress("0x321987456");
const mdexSetAbi: string = "function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate)";
const testMdexPoolId: number = 456;
const testMdexAllocPoint: number = 654;
const testMdexWithUpdate: boolean = true;
const mdexIFace = new utils.Interface([mdexSetAbi])
const encodedMdexSetFuncCall: string = mdexIFace.encodeFunctionData("set", [testMdexPoolId, testMdexAllocPoint, testMdexWithUpdate]);
const testMdexAddressMap: Map<number, string> = new Map([[testMdexPoolId, testMdexLpAddress]]);
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ \\
const testPoolControllers: string[] = [testTimelockContract, testBoardRoomMdx]

const completeTestPools: Map<string, Map<number, string>> = new Map([
  [testPoolControllers[0], testAddressMap],
  [testPoolControllers[1], testMdexAddressMap]
]);


describe("AllocPoint Change Alert Agent", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(completeTestPools, testPoolControllers);
  })

  it("should return a Finding from QueueTransaction event emission in Timelock contract", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testTimelockContract)
      .addEventLog(queueTxnEventSig, testTimelockContract, pcsData, ...pcsTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "AllocPoint Change Event",
        description: "Pool's alloc point queued for update.",
        alertId: "ALPACA-6",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata:{
          positionId: testPoolId.toString(),
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
      .addEventLog(badQueueTxnSig, testTimelockContract, pcsData, ...pcsTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings from QueueTransaction due to incorrect Set function signature", async () => {
    const badSetFuncSig: string = 'badSig';

    const pcsBadData: string = encodeParameters(
      ["uint256", "string", "bytes", "uint256"],
      [testValue, badSetFuncSig, encodedSetFuncCall, testEta]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testTimelockContract)
      .addEventLog(queueTxnEventSig, testTimelockContract, pcsBadData, ...pcsTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a Finding from Set function call from Mdex", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testBoardRoomMdx)
      .setData(encodedMdexSetFuncCall)

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "AllocPoint Change Event",
        description: "Pool's alloc point queued for update.",
        alertId: "ALPACA-6",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata:{
          positionId: testMdexPoolId.toString(),
          allocPoint: testMdexAllocPoint.toString(),
          withUpdate: testMdexWithUpdate.toString(),
          target: testBoardRoomMdx
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
      .setTo(testBoardRoomMdx)
      .setData(badEncodedUpdatePoolFuncCall)

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
})
