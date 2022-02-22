import {
  HandleTransaction,
  TransactionEvent
} from "forta-agent"
import { 
  createAddress,
  TestTransactionEvent,
  encodeParameters
} from "forta-agent-tools";
import {
  provideHandleTransaction,
  createFinding
} from "./agent"
import { BigNumber } from "ethers";

const workEventSig: string = "Work(uint256,uint256)";

const TEST_VAULT_ADDRESS: string = createAddress("0x32aB30Cde");
const TEST_VAULT_THRESHOLD_MAP: Map<string, BigNumber> = new Map([
  [TEST_VAULT_ADDRESS.toLowerCase(), BigNumber.from("100000000000000000000000")] // 100,000
])

const testMsgSender: string = createAddress("0x3bc24EF");

describe("Large Position Alert Agent", () => {
  let handleTransaction: HandleTransaction

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(TEST_VAULT_THRESHOLD_MAP);
  });

  it("should return a Finding from Work event emission in test Vault", async () => {
    const testPositionId: number = 123;
    const testBorrowAmount: BigNumber = BigNumber.from("500000000000000000000000"); // 500,000

    const testData: string = encodeParameters(
      ["uint256"],
      [testBorrowAmount]
    );

    const testTopics: string[] = [
      encodeParameters(["uint256"], [testPositionId])
    ];

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(TEST_VAULT_ADDRESS)
      .addEventLog(workEventSig, TEST_VAULT_ADDRESS, testData, ...testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        testPositionId,
        testBorrowAmount,
        TEST_VAULT_ADDRESS.toLowerCase()
      )
    ]);
  });

  it("should return no Findings due to incorrect event signature", async () => {
    const testPositionId: number = 654;
    const testBorrowAmount: BigNumber = BigNumber.from("200000000000000000000000"); // 200,000

    const testData: string = encodeParameters(
      ["uint256"],
      [testBorrowAmount]
    );

    const testTopics: string[] = [
      encodeParameters(["uint256"], [testPositionId])
    ];

    const badWorkSig: string = 'badSig';

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(TEST_VAULT_ADDRESS, testMsgSender)
      .addEventLog(badWorkSig, TEST_VAULT_ADDRESS, testData, ...testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings due to wrong contract address", async () => {
    const testPositionId: number = 963;
    const testBorrowAmount: BigNumber = BigNumber.from("350000000000000000000000"); // 350,000

    const testData: string = encodeParameters(
      ["uint256"],
      [testBorrowAmount]
    );

    const testTopics: string[] = [
      encodeParameters(["uint256"], [testPositionId])
    ];

    const wrongVaultAddress: string = createAddress("0x1aBC43Fe");

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(wrongVaultAddress, testMsgSender)
      .addEventLog(workEventSig, wrongVaultAddress, testData, ...testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings due not passing borrow amount threshold", async () => {
    const testPositionId: number = 147;
    const testBorrowAmount: BigNumber = BigNumber.from("5000000000000000000000"); // 5,000

    const testData: string = encodeParameters(
      ["uint256"],
      [testBorrowAmount]
    );

    const testTopics: string[] = [
      encodeParameters(["uint256"], [testPositionId])
    ];

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addInvolvedAddresses(TEST_VAULT_ADDRESS, testMsgSender)
      .addEventLog(workEventSig, TEST_VAULT_ADDRESS, testData, ...testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return multiple Findings from Work event emissions in test Vault", async () => {
    const testPositionId: number = 258;
    const testBorrowAmount: BigNumber = BigNumber.from("800000000000000000000000"); // 800,000

    const testData: string = encodeParameters(
      ["uint256"],
      [testBorrowAmount]
    );

    const testTopics: string[] = [
      encodeParameters(["uint256"], [testPositionId])
    ];

    const testPositionIdTwo: number = 159;
    const testBorrowAmountTwo: BigNumber = BigNumber.from("630000000000000000000000"); // 630,000

    const testDataTwo: string = encodeParameters(
      ["uint256"],
      [testBorrowAmountTwo]
    );

    const testTopicsTwo: string[] = [
      encodeParameters(["uint256"], [testPositionIdTwo])
    ];

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setFrom(testMsgSender)
      .setTo(TEST_VAULT_ADDRESS)
      .addEventLog(workEventSig, TEST_VAULT_ADDRESS, testData, ...testTopics)
      .addEventLog(workEventSig, TEST_VAULT_ADDRESS, testDataTwo, ...testTopicsTwo);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(
        testPositionId,
        testBorrowAmount,
        TEST_VAULT_ADDRESS.toLowerCase()
      ),
      createFinding(
        testPositionIdTwo,
        testBorrowAmountTwo,
        TEST_VAULT_ADDRESS.toLowerCase()
      )
    ]);
  });
})