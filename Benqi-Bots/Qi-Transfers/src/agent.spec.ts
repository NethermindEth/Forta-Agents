import { HandleTransaction, Finding, FindingSeverity, FindingType } from "forta-agent";
import { Interface } from "ethers/lib/utils";
import { provideHandleTransaction } from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";
import { when, resetAllWhenMocks } from "jest-when";
import { createLargeBalanceFinding, EVENT_ABI } from "./utils";
import { BigNumber } from "ethers";

const TEST_QI_TOKEN_CONTRACT = createAddress("0xa1");
const TEST_BENQI_IFACE = new Interface(EVENT_ABI);
const IRRELEVANT_EVENT_IFACE = new Interface([
  "event IrrelevantEvent(address indexed from, address indexed to, uint256 amount)",
]);

const mockFetcher = {
  getBalance: jest.fn(),
  qiTokenAddress: TEST_QI_TOKEN_CONTRACT,
};

const testTransferAmounts: BigNumber[] = [
  BigNumber.from("2000000000000000000000000"), //above threshold
  BigNumber.from("3000000000000000000000000"), //above threshold
  BigNumber.from("100000000000000000"), //below threshold
];

const testBalances: BigNumber[] = [
  BigNumber.from("370000000000000000000000000"), //above threshold
  BigNumber.from("400000000000000000000000000"), //above threshold
  BigNumber.from("10000000000000000000000"), //below threshold
];

const testBlock: number = 12400000;

const testAccounts: string[] = [createAddress("0x1"), createAddress("0x2"), createAddress("0x3")];

const createTransferFinding = (logDesc: any) => {
  return Finding.fromObject({
    name: "QI Token Transfer",
    description: "Large amount of QI token transfer is detected",
    alertId: "BENQI-3-1",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Benqi Finance",
    metadata: {
      from: logDesc.args.from,
      to: logDesc.args.to,
      amount: logDesc.args.amount.toString(),
    },
  });
};

describe("Benqi Token (QI) Transfer and Balance Tests", () => {
  let handleTransaction: HandleTransaction;

  const transferredTokenThreshold = BigNumber.from("1000000").mul(`${10 ** 18}`); // 1 million tokens
  const balanceThreshold = BigNumber.from("7200000000")
    .mul(`${10 ** 18}`)
    .mul(5) // 5% of total supply
    .div(100);

  beforeEach(() => {
    resetAllWhenMocks();

    handleTransaction = provideHandleTransaction(mockFetcher as any, transferredTokenThreshold, balanceThreshold);
  });

  it("should ignore transactions without events", async () => {
    const transactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handleTransaction(transactionEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty finding if transferred amount and account balance are below threshold", async () => {
    when(mockFetcher.getBalance).calledWith(testAccounts[2], testBlock).mockReturnValue(testBalances[2]);

    const log1 = TEST_BENQI_IFACE.encodeEventLog(TEST_BENQI_IFACE.getEvent("Transfer"), [
      createAddress("0xaaa"), // address from
      testAccounts[2], // address to
      testTransferAmounts[2], // transferred amount
    ]);

    const transactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_QI_TOKEN_CONTRACT, log1.data, ...log1.topics)
      .setBlock(testBlock);
    const findings = await handleTransaction(transactionEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if transferred amount is above threshold", async () => {
    when(mockFetcher.getBalance).calledWith(testAccounts[2], testBlock).mockReturnValue(testBalances[2]);

    const log1 = TEST_BENQI_IFACE.encodeEventLog(TEST_BENQI_IFACE.getEvent("Transfer"), [
      createAddress("0xbaa"), // address from
      testAccounts[2], // address to
      testTransferAmounts[0], // transferred amount
    ]);

    const transactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_QI_TOKEN_CONTRACT, log1.data, ...log1.topics)
      .setBlock(testBlock);
    const findings = await handleTransaction(transactionEvent);

    expect(findings).toStrictEqual([createTransferFinding(TEST_BENQI_IFACE.parseLog(log1))]);
  });

  it("ignore other events on the same contract", async () => {
    when(mockFetcher.getBalance).calledWith(testAccounts[0], testBlock).mockReturnValue(testBalances[0]);

    const log1 = IRRELEVANT_EVENT_IFACE.encodeEventLog(IRRELEVANT_EVENT_IFACE.getEvent("IrrelevantEvent"), [
      createAddress("0xcaa"), // address from
      testAccounts[0], // address to
      testTransferAmounts[0], // transferred amount
    ]);

    const transactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_QI_TOKEN_CONTRACT, log1.data, ...log1.topics)
      .setBlock(testBlock);
    const findings = await handleTransaction(transactionEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return multiple findings if transferred amounts are above threshold", async () => {
    when(mockFetcher.getBalance).calledWith(testAccounts[2], testBlock).mockReturnValue(testBalances[2]);
    when(mockFetcher.getBalance).calledWith(testAccounts[1], testBlock).mockReturnValue(testBalances[2]);
    when(mockFetcher.getBalance).calledWith(testAccounts[0], testBlock).mockReturnValue(testBalances[0]);

    const log1 = TEST_BENQI_IFACE.encodeEventLog(TEST_BENQI_IFACE.getEvent("Transfer"), [
      createAddress("0xdaa"), // address from
      testAccounts[2], // address to
      testTransferAmounts[0], // transferred amount
    ]);

    const log2 = TEST_BENQI_IFACE.encodeEventLog(TEST_BENQI_IFACE.getEvent("Transfer"), [
      createAddress("0xdba"), // address from
      testAccounts[1], // address to
      testTransferAmounts[1], // transferred amount
    ]);
    const log3 = IRRELEVANT_EVENT_IFACE.encodeEventLog(IRRELEVANT_EVENT_IFACE.getEvent("IrrelevantEvent"), [
      createAddress("0xdca"), // address from
      testAccounts[0], // address to
      testTransferAmounts[0], // transferred amount
    ]);

    const transactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_QI_TOKEN_CONTRACT, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_QI_TOKEN_CONTRACT, log2.data, ...log2.topics)
      .addAnonymousEventLog(TEST_QI_TOKEN_CONTRACT, log3.data, ...log3.topics)
      .setBlock(testBlock);
    const findings = await handleTransaction(transactionEvent);

    expect(findings).toStrictEqual([
      createTransferFinding(TEST_BENQI_IFACE.parseLog(log1)),
      createTransferFinding(TEST_BENQI_IFACE.parseLog(log2)),
    ]);
  });

  it("should return a finding if an account's balance is above threshold", async () => {
    when(mockFetcher.getBalance).calledWith(testAccounts[0], testBlock).mockReturnValue(testBalances[0]);

    const log1 = TEST_BENQI_IFACE.encodeEventLog(TEST_BENQI_IFACE.getEvent("Transfer"), [
      createAddress("0xeaa"), // address from
      testAccounts[0], // address to
      testTransferAmounts[2], // transferred amount
    ]);

    const transactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_QI_TOKEN_CONTRACT, log1.data, ...log1.topics)
      .setBlock(testBlock);
    const findings = await handleTransaction(transactionEvent);

    expect(findings).toStrictEqual([createLargeBalanceFinding(testAccounts[0], testBalances[0])]);
  });

  it("should return multiple findings if accounts' balances are above threshold", async () => {
    when(mockFetcher.getBalance).calledWith(testAccounts[0], testBlock).mockReturnValue(testBalances[0]);
    when(mockFetcher.getBalance).calledWith(testAccounts[1], testBlock).mockReturnValue(testBalances[1]);

    const log1 = TEST_BENQI_IFACE.encodeEventLog(TEST_BENQI_IFACE.getEvent("Transfer"), [
      createAddress("0xfaa"), // address from
      testAccounts[0], // address to
      testTransferAmounts[2], // transferred amount
    ]);
    const log2 = TEST_BENQI_IFACE.encodeEventLog(TEST_BENQI_IFACE.getEvent("Transfer"), [
      createAddress("0xfba"), // address from
      testAccounts[1], // address to
      testTransferAmounts[2], // transferred amount
    ]);

    const transactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_QI_TOKEN_CONTRACT, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_QI_TOKEN_CONTRACT, log2.data, ...log2.topics)
      .setBlock(testBlock);
    const findings = await handleTransaction(transactionEvent);

    expect(findings).toStrictEqual([
      createLargeBalanceFinding(testAccounts[0], testBalances[0]),
      createLargeBalanceFinding(testAccounts[1], testBalances[1]),
    ]);
  });

  it("should return 2 findings if transferred amount and account balance are above threshold", async () => {
    when(mockFetcher.getBalance).calledWith(testAccounts[0], testBlock).mockReturnValue(testBalances[0]);

    const log1 = TEST_BENQI_IFACE.encodeEventLog(TEST_BENQI_IFACE.getEvent("Transfer"), [
      createAddress("0xaba"), // address from
      testAccounts[0], // address to
      testTransferAmounts[1], // transferred amount
    ]);

    const transactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_QI_TOKEN_CONTRACT, log1.data, ...log1.topics)
      .setBlock(testBlock);
    const findings = await handleTransaction(transactionEvent);

    expect(findings).toStrictEqual([
      createTransferFinding(TEST_BENQI_IFACE.parseLog(log1)),
      createLargeBalanceFinding(testAccounts[0], testBalances[0]),
    ]);
  });

  it("should return multiple findings for both transfer amount and balance, if multiple transferred amounts and accounts' balances are above threshold", async () => {
    when(mockFetcher.getBalance).calledWith(testAccounts[0], testBlock).mockReturnValue(testBalances[0]);
    when(mockFetcher.getBalance).calledWith(testAccounts[1], testBlock).mockReturnValue(testBalances[1]);

    const log1 = TEST_BENQI_IFACE.encodeEventLog(TEST_BENQI_IFACE.getEvent("Transfer"), [
      createAddress("0xaca"), // address from
      testAccounts[0], // address to
      testTransferAmounts[1], // transferred amount
    ]);

    const log2 = TEST_BENQI_IFACE.encodeEventLog(TEST_BENQI_IFACE.getEvent("Transfer"), [
      createAddress("0xacb"), // address from
      testAccounts[1], // address to
      testTransferAmounts[0], // transferred amount
    ]);

    const transactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_QI_TOKEN_CONTRACT, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_QI_TOKEN_CONTRACT, log2.data, ...log2.topics)
      .setBlock(testBlock);
    const findings = await handleTransaction(transactionEvent);

    expect(findings).toStrictEqual([
      createTransferFinding(TEST_BENQI_IFACE.parseLog(log1)),
      createLargeBalanceFinding(testAccounts[0], testBalances[0]),
      createTransferFinding(TEST_BENQI_IFACE.parseLog(log2)),
      createLargeBalanceFinding(testAccounts[1], testBalances[1]),
    ]);
  });

  it("should ignore events emitted on a different contract", async () => {
    when(mockFetcher.getBalance).calledWith(testAccounts[0], testBlock).mockReturnValue(testBalances[0]);
    const differentContract = createAddress("0xd4");

    const log1 = TEST_BENQI_IFACE.encodeEventLog(TEST_BENQI_IFACE.getEvent("Transfer"), [
      createAddress("0xada"), // address from
      testAccounts[0], // address to
      testTransferAmounts[1], // transferred amount
    ]);

    const transactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(differentContract, log1.data, ...log1.topics)
      .setBlock(testBlock);
    const findings = await handleTransaction(transactionEvent);

    expect(findings).toStrictEqual([]);
  });
});
