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
  provideHandleTransaction,
  pcsTimelockAddress
} from "./agent";

/*
const TEST_VAULT_ADDRESSES: string[] = [createAddress("0x4321")];


const testId: number = 1;
const testKiller: string = createAddress("0x0101");
const testOwner: string = createAddress("0x0202");
const testPosVal: bigint = BigInt(100000000000000000000000);  // 100,000
const testDebt: bigint = BigInt(10000000000000000000000);     // 10,000
const testPrize: bigint = BigInt(5000000000000000000000);     // 5,000
const testLeft: bigint = BigInt(85000000000000000000000);     // 85,000

const data: string = encodeParameters(
  ["address", "uint256", "uint256", "uint256", "uint256"],
  [testOwner, testPosVal, testDebt, testPrize, testLeft]
);

const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(TEST_VAULT_ADDRESSES[0])
      .addEventLog(killEventSig, TEST_VAULT_ADDRESSES[0], data, ...topics);
*/

const testMsgSender: string = createAddress("0x1234");


// Test MDEX Data
const testBoardRoomMdx: string = createAddress("0x543678");
const setFuncSig: string = "set(uint256,uint256,bool)";
const testMdexPosId: number = 456;
const testMdexAllocPoint: number = 654;
const testMdexWithUpdate: boolean = true;
const mdexData: string = encodeParameters(
  ["uint256", "uint256", "bool"],
  [testMdexPosId, testMdexAllocPoint, testMdexWithUpdate]
);


// Test PancakeSwap Data ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const queueTxnEventSig: string = "QueueTransaction(bytes32,address,uint,string,bytes,uint)";
const pcsSetFuncSig: string = "set(uint256,uint256,bool)";

const testTxHash: string = "0x0000000000000000000000000000000000000000000000000000000000000023";
const pcsMainStakingContract: string = "0x73feaa1eE314F8c655E354234017bE2193C9E24E"; // PancakeSwap main staking contract
const testValue: bigint = BigInt(1000000000000000000);    // 1.0
const testEta: number = 14000000;

// Arguments for a test call to set()
const testPositionId: number = 123;
const testAllocPoint: number = 321;
const testWithUpdate: boolean = true;
// Encoded arguments for set() function call
const encodedSetFuncCall: string = encodeParameters(
  ["uint256", "uint256", "bool"],
  [testPositionId, testAllocPoint, testWithUpdate]
);

// event QueueTransaction(bytes32 indexed txHash, address indexed target);
const pcsTopics: string[] = [
  encodeParameters(["bytes32"], [testTxHash]),
  encodeParameters(["address"], [pcsMainStakingContract])
];

// event QueueTransaction(uint value, string signature, bytes data, uint eta);
const pcsData: string = encodeParameters(
  ["uint", "string", "bytes", "uint"],
  [testValue, pcsSetFuncSig, encodedSetFuncCall, testEta]
);
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


describe("AllocPoint Change Alert Agent", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction()
  })

  /*
  it("should return a Finding from Set function call from Mdex", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(testBoardRoomMdx)
      // THIS IS A FUNCTION CALL BECAUSE set DOESN'T EMIT AN event
      // TODO: CONFIRM USING CORRECT CONTRACT FROM MDEX
      .addEventLog(setFuncSig, testBoardRoomMdx, mdexData);

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
          lpPool: testBoardRoomMdx
        }
      }),
    ])
  })
  */

  it("should return a Finding from QueueTransaction event emission in Timelock contract", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(pcsTimelockAddress)
      .addEventLog(queueTxnEventSig, pcsTimelockAddress, pcsData, ...pcsTopics);

    console.log("txEvent in the first unit test is: " + JSON.stringify(txEvent));

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
          lpPool: pcsMainStakingContract
        }
      }),
    ]);
  });
})
