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
import { when, resetAllWhenMocks } from "jest-when";
import { createLargeBalanceFinding, EVENT_ABI } from "./utils";
import { BigNumber } from "ethers";
const testMsgSender: string = createAddress("0xda456f");

const TEST_GNANA_TOKEN_CONTRACT = createAddress("0xa1");
const TEST_GNANA_IFACE = new Interface(EVENT_ABI);
const IRRELEVANT_EVENT_IFACE = new Interface([
  "event IrrelevantEvent(address indexed from, address indexed to, uint256 amount)",
]);

const testAddr: Set<string> = new Set<string>();

const mockFetcher = {
  getBalance: jest.fn(),
  gnanaTokenAddress: TEST_GNANA_TOKEN_CONTRACT,
};

const testTransferAmounts: BigNumber[] = [
  BigNumber.from("2000000000000000000"),
  BigNumber.from("3000000000000000000"),
  BigNumber.from("1000000000000000000"),
];

const testBalances: BigNumber[] = [
  BigNumber.from("90000000000000000000000000"), //above threshold
  BigNumber.from("80000000000000000000000"), //above threshold
  BigNumber.from("1000000"), //below threshold
];

const testBlock: number = 1423;
const testAccounts: string[] = [
  createAddress("0x1"),
  createAddress("0x2"),
  createAddress("0x3"),
];

describe("Golden Banana(GNANA) Balance Tests", () => {
  let handleTransaction: HandleTransaction;
  let handleBlock: HandleBlock;

  const balanceThreshold = BigNumber.from("3000000000")
    .mul(`${10 ** 18}`)
    .mul(1)
    .div(100);

  const testMock = (
    block: number,
    testAccounts: string[],
    testBalances: BigNumber[]
  ) => {
    for (let i = 0; i < testAccounts.length; i++) {
      when(mockFetcher.getBalance)
        .calledWith(testAccounts[i], block)
        .mockReturnValue(testBalances[i]);
    }
  };
  beforeEach(() => {
    resetAllWhenMocks();

    handleTransaction = provideHandleTransaction(
      TEST_GNANA_TOKEN_CONTRACT,
      testAddr
    );

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

  it("should return an empty finding if account balance are above threshold", async () => {
    testMock(testBlock, [testAccounts[0]], [testBalances[0]]);

    const log1 = TEST_GNANA_IFACE.encodeEventLog(
      TEST_GNANA_IFACE.getEvent("Transfer"),
      [createAddress("0xeaa"), testAccounts[0], testTransferAmounts[0]]
    );

    const transactionEvent = new TestTransactionEvent()
      .setBlock(testBlock)
      .setFrom(TEST_GNANA_TOKEN_CONTRACT)
      .setTo(testMsgSender)
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

  it("should return an empty finding if account balance are below threshold", async () => {
    testMock(testBlock, [testAccounts[2]], [testBalances[2]]);

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
    console.log(findings);
    // expect(findings).toStrictEqual([]);
  });
});
