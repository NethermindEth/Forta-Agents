import {
  HandleTransaction,
  Finding,
  HandleBlock,
  BlockEvent,
} from "forta-agent";
import { Interface } from "ethers/lib/utils";
import { provideHandleBlock, provideHandleTransaction } from "./agent";
import {
  createAddress,
  TestTransactionEvent,
  TestBlockEvent,
} from "forta-agent-tools/lib/tests.utils";
import { when } from "jest-when";
import { createLargeBalanceFinding, EVENT_ABI } from "./utils";
import { BigNumber } from "ethers";

const TEST_GNANA_TOKEN_CONTRACT = createAddress("0xa1");
const TEST_GNANA_IFACE = new Interface(EVENT_ABI);
const IRRELEVANT_EVENT_IFACE = new Interface([
  "event IrrelevantEvent(address indexed from, address indexed to, uint256 amount)",
]);

const mockFetcher = {
  getBalance: jest.fn(),
  gnanaTokenAddress: TEST_GNANA_TOKEN_CONTRACT,
};

const testTransferAmounts: BigNumber[] = [
  BigNumber.from("2000000000000000000"),
  BigNumber.from("3000000000000000000"),
  BigNumber.from("30000"),
];

const testBalances: BigNumber[] = [
  BigNumber.from("90000000000000000000000000"), //above threshold
  BigNumber.from("80000000000000000000000000"), //above threshold
  BigNumber.from("30000"), //below threshold
];

const testBlock: number = 50;
const testAccounts: string[] = [
  createAddress("0x1"),
  createAddress("0x2"),
  createAddress("0x3"),
];

describe("Golden Banana(GNANA) Large Balance Tests", () => {
  let handleTransaction: HandleTransaction;
  let handleBlock: HandleBlock;

  const balanceThreshold = BigNumber.from("3000000000")
    .mul(`${10 ** 18}`)
    .mul(1)
    .div(100);

  beforeEach(() => {
    const testAddr: Set<string> = new Set<string>();

    mockFetcher.getBalance.mockClear();
    handleTransaction = provideHandleTransaction(mockFetcher as any, testAddr);

    handleBlock = provideHandleBlock(
      mockFetcher as any,
      balanceThreshold,
      testAddr
    );
  });

  it("should return 0 findings in empty transactions", async () => {
    const transactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handleTransaction(transactionEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if account balance is above threshold", async () => {
    when(mockFetcher.getBalance)
      .calledWith(testAccounts[0], testBlock)
      .mockReturnValue(testBalances[0]);

    const log1 = TEST_GNANA_IFACE.encodeEventLog(
      TEST_GNANA_IFACE.getEvent("Transfer"),
      [createAddress("0xeaa"), testAccounts[0], testTransferAmounts[0]]
    );

    const transactionEvent = new TestTransactionEvent()
      .setBlock(testBlock)
      .addAnonymousEventLog(
        TEST_GNANA_TOKEN_CONTRACT,
        log1.data,
        ...log1.topics
      );
    await handleTransaction(transactionEvent);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlock);

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createLargeBalanceFinding(testAccounts[0], testBalances[0]),
    ]);
  });

  it("should return an empty finding if account balance is below threshold", async () => {
    when(mockFetcher.getBalance)
      .calledWith(testAccounts[2], testBlock)
      .mockReturnValue(testBalances[2]);

    const log1 = TEST_GNANA_IFACE.encodeEventLog(
      TEST_GNANA_IFACE.getEvent("Transfer"),
      [createAddress("0xaaa"), testAccounts[2], testTransferAmounts[2]]
    );

    const transactionEvent = new TestTransactionEvent()
      .setBlock(testBlock)
      .addAnonymousEventLog(
        TEST_GNANA_TOKEN_CONTRACT,
        log1.data,
        ...log1.topics
      );
    await handleTransaction(transactionEvent);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlock);

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding for incorrect address", async () => {
    const differentContract = createAddress("0xd4");

    when(mockFetcher.getBalance)
      .calledWith(testAccounts[0], testBlock)
      .mockReturnValue(testBalances[0]);

    const log1 = TEST_GNANA_IFACE.encodeEventLog(
      TEST_GNANA_IFACE.getEvent("Transfer"),
      [createAddress("0xada"), testAccounts[0], testTransferAmounts[0]]
    );

    const transactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(differentContract, log1.data, ...log1.topics)
      .setBlock(testBlock);

    await handleTransaction(transactionEvent);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlock);

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return an empty finding for incorrect event signature", async () => {
    when(mockFetcher.getBalance)
      .calledWith(testAccounts[0], testBlock)
      .mockReturnValue(testBalances[0]);

    const log1 = IRRELEVANT_EVENT_IFACE.encodeEventLog(
      IRRELEVANT_EVENT_IFACE.getEvent("IrrelevantEvent"),
      [createAddress("0xcaa"), testAccounts[0], testTransferAmounts[1]]
    );

    const transactionEvent = new TestTransactionEvent()
      .setBlock(testBlock)
      .addAnonymousEventLog(
        TEST_GNANA_TOKEN_CONTRACT,
        log1.data,
        ...log1.topics
      );
    await handleTransaction(transactionEvent);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlock);

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return multiple findings if multiple accounts' balances are above threshold", async () => {
    when(mockFetcher.getBalance)
      .calledWith(testAccounts[0], testBlock)
      .mockReturnValue(testBalances[0]);
    when(mockFetcher.getBalance)
      .calledWith(testAccounts[1], testBlock)
      .mockReturnValue(testBalances[1]);

    const log1 = TEST_GNANA_IFACE.encodeEventLog(
      TEST_GNANA_IFACE.getEvent("Transfer"),
      [createAddress("0xeaa"), testAccounts[0], testTransferAmounts[0]]
    );
    const log2 = TEST_GNANA_IFACE.encodeEventLog(
      TEST_GNANA_IFACE.getEvent("Transfer"),
      [createAddress("0xeaa"), testAccounts[1], testTransferAmounts[1]]
    );

    const transactionEvent = new TestTransactionEvent()
      .setBlock(testBlock)
      .addAnonymousEventLog(
        TEST_GNANA_TOKEN_CONTRACT,
        log1.data,
        ...log1.topics
      )
      .addAnonymousEventLog(
        TEST_GNANA_TOKEN_CONTRACT,
        log2.data,
        ...log2.topics
      );

    await handleTransaction(transactionEvent);

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(testBlock);

    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([
      createLargeBalanceFinding(testAccounts[0], testBalances[0]),
      createLargeBalanceFinding(testAccounts[1], testBalances[1]),
    ]);
  });
});
