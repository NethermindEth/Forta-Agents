import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent
} from "forta-agent"
import { 
  createAddress,
  TestTransactionEvent,
  encodeParameters
} from "forta-agent-tools";
import { provideHandleTransaction } from "./agent"

const TEST_VAULT_ADDRESSES: string[] = [createAddress('0x4321')];
const testMsgSender: string = createAddress('0x1234');

const killEventSig: string = "Kill(uint256,address,address,uint256,uint256,uint256,uint256)";

// TODO: CONFIRM THE MATH ADDS UP TO AN ACTUAL LIQUDIATION EXCUTION
const testId: number = 1;
const testKiller: string = createAddress('0x0101');
const testOwner: string = createAddress('0x0202');
const testPosVal: bigint = BigInt(100000000000000000000000);  // 100,000
const testDebt: bigint = BigInt(10000000000000000000000);     // 10,000
const testPrize: bigint = BigInt(5000000000000000000000);     // 5,000
const testLeft: bigint = BigInt(85000000000000000000000);     // 85,000

const data: string = encodeParameters(
  ["uint256","address","address", "uint256", "uint256", "uint256", "uint256"],
  [testId, testKiller, testOwner, testPosVal, testDebt, testPrize, testLeft]
);

describe("Liquidation Alert Agent", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(TEST_VAULT_ADDRESSES);
  })

  it('should return a Finding from Kill event emission', async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(TEST_VAULT_ADDRESSES[0])
      .addEventLog(killEventSig, TEST_VAULT_ADDRESSES[0], data);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Liquidation Event",
        description: "Liquidation Has Occurred",
        alertId: "ALPACA-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          positionId: testId.toString(),
          positionkiller: testKiller,
          positionOwner: testOwner,
          positionValue: testPosVal.toString(),
          debt: testDebt.toString(),
          prize: testPrize.toString(),
          left: testLeft.toString(),
          vault: TEST_VAULT_ADDRESSES[0]
        }
      }),
    ]);
  });

  it("should return no Findings due to incorrect event signature", async () => {
    const badWorkSig: string = 'badSig';

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(TEST_VAULT_ADDRESSES[0], testMsgSender)
      .addEventLog(badWorkSig, TEST_VAULT_ADDRESSES[0], data);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings due to wrong contract ddress", async () => {
    const wrongVaultAddress: string = createAddress("0x1111");

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(wrongVaultAddress, testMsgSender)
      .addEventLog(killEventSig,wrongVaultAddress);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
})