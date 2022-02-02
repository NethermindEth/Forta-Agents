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
const testPositionId: number = 123;
const testAllocPoint: number = 321;
const testWithUpdate: boolean = true;
// Encoded arguments for set() function call
const encodedSetFuncCall: string = encodeParameters(
  ["uint256", "uint256", "bool"],
  [testPositionId, testAllocPoint, testWithUpdate]
);

const testAddressMap: Map<number, string> = new Map([[testPositionId, testLpAddress]]);
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
const setFuncSig: string = "set(uint256,uint256,bool)";
const mdexSetAbi: string = "function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate)";
const testMdexPosId: number = 456;
const testMdexAllocPoint: number = 654;
const testMdexWithUpdate: boolean = true;
const mdexData: string = encodeParameters(
  ["uint256", "uint256", "bool"],
  [testMdexPosId, testMdexAllocPoint, testMdexWithUpdate]
);
const mdexIFace = new utils.Interface([mdexSetAbi])
const encodedMdexSetFuncCall: string = mdexIFace.encodeFunctionData("set", [testMdexPosId, testMdexAllocPoint, testMdexWithUpdate]);
const testMdexAddressMap: Map<number, string> = new Map([[testMdexPosId, testMdexLpAddress]]);
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ \\

const completeTestPools: Map<number, string>[] = [testAddressMap, testMdexAddressMap];


describe("AllocPoint Change Alert Agent", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(completeTestPools);
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
          positionId: testPositionId.toString(),
          allocPoint: testAllocPoint.toString(),
          withUpdate: testWithUpdate.toString(),
          target: testStakingContract
        }
      }),
    ]);
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
          positionId: testMdexPosId.toString(),
          allocPoint: testMdexAllocPoint.toString(),
          withUpdate: testMdexWithUpdate.toString(),
          target: testBoardRoomMdx
        }
      }),
    ])
  })
})
