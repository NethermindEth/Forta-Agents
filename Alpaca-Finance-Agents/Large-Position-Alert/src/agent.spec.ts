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
import {
  provideHandleTransaction
} from "./agent"

const workEventSig: string = "Work(uint256,uint256)";

const TEST_VAULT_ADDRESS: string = createAddress("0x3230");
const TEST_VAULT_MAP: Map<string, bigint> = new Map([
  [TEST_VAULT_ADDRESS, BigInt(100000000000000000000000)] // 100,000
])

const testPositionId: number = 123;
const testBorrowAmount = BigInt(500000000000000000000000); // 500,000
const testMsgSender: string = createAddress("0x3");

const data: string = encodeParameters(
  ["uint256", "uint256"],
  [testPositionId, testBorrowAmount]
);

describe("Large Position Alert Agent", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(TEST_VAULT_MAP);
  });

  it("should return a Finding from Work event emission in test Vault", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(TEST_VAULT_ADDRESS)
      .addEventLog(workEventSig, TEST_VAULT_ADDRESS, data);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Large Position Event",
        description: "Large Position Has Been Taken",
        alertId: "ALPACA-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          positionId: testPositionId.toString(),
          loanAmount: testBorrowAmount.toString(),
          vault: TEST_VAULT_ADDRESS.toLowerCase()
        }
      }),
    ]);
  });

  it("should return no Findings due to incorrect event signature", async () => {
    const badWorkSig: string = 'badSig';

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(TEST_VAULT_ADDRESS, testMsgSender)
      .addEventLog(badWorkSig, TEST_VAULT_ADDRESS, data);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings due to wrong contract ddress", async () => {
    const wrongVaultAddress: string = createAddress("0x1111");

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(wrongVaultAddress, testMsgSender)
      .addEventLog(workEventSig,wrongVaultAddress);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings due not passing borrow amount threshold", async () => {
    const lowBorrowAmount = BigInt(5000000000000000000000); // 5,000

    const lowBorrowAmountData: string = encodeParameters(
      ["uint256", "uint256"],
      [testPositionId, lowBorrowAmount]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(TEST_VAULT_ADDRESS, testMsgSender)
      .addEventLog(workEventSig, TEST_VAULT_ADDRESS, lowBorrowAmountData);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
})