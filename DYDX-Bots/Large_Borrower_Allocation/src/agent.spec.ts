import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { encodeParameter, encodeParameters } from "forta-agent-tools";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { provideHandleTransaction } from "./agent";
import NetworkManager from "./network";
import { SCHED_BORROW_ALLOC_CHANGE_SIG } from "./utils";

const testSender: string = createAddress("0xac");
const testThreshold: BigNumber = BigNumber.from("12000000000000000000"); // 12

const testCases: any[][] = [
  // Format: borrower, oldAllocation, newAllocation, epochNumber
  [
    createAddress("0xad"),
    BigNumber.from("10000000000000000000"), // 10
    BigNumber.from("15000000000000000000"), // 15
    BigNumber.from("100000000000000000000"), // 100
  ],
  [
    createAddress("0xae"),
    BigNumber.from("11000000000000000000"), // 11
    BigNumber.from("17000000000000000000"), // 17
    BigNumber.from("150000000000000000000"), // 150
  ],
  [
    createAddress("0xaf"),
    BigNumber.from("8000000000000000000"), // 8
    BigNumber.from("10000000000000000000"), // 10
    BigNumber.from("200000000000000000000"), // 200
  ],
  [
    createAddress("0xad2"),
    BigNumber.from("11000000000000000000"), // 11
    BigNumber.from("14000000000000000000"), // 14
    BigNumber.from("250000000000000000000"), // 250
  ],
  [
    createAddress("0xae2"),
    BigNumber.from("6000000000000000000"), // 6
    BigNumber.from("9000000000000000000"), // 9
    BigNumber.from("300000000000000000000"), // 300
  ],
  [
    createAddress("0xaf2"),
    BigNumber.from("5000000000000000000"), // 5
    BigNumber.from("18000000000000000000"), // 18
    BigNumber.from("350000000000000000000"), // 350
  ],
];

describe("Large Borrower Allocation test suite", () => {
  let handleTransaction: HandleTransaction;

  const mockNetworkManager: NetworkManager = {
    liquidityModule: createAddress("0xab"),
    setNetwork: jest.fn(),
  };

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(mockNetworkManager, testThreshold);
  });

  it("should return 0 findings in empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect a large newAllocation event", async () => {
    const testTopics = encodeParameter("address", testCases[0][0]);
    const testData = encodeParameters(
      ["uint256", "uint256", "uint256"],
      [testCases[0][1], testCases[0][2], testCases[0][3]]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testSender)
      .addEventLog(SCHED_BORROW_ALLOC_CHANGE_SIG, mockNetworkManager.liquidityModule, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Large borrower allocation detected on dYdX perpetual exchange.",
        description: "ScheduledBorrowerAllocationChange event emitted with a large newAllocation",
        alertId: "DYDX-16",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          borrower: testCases[0][0],
          oldAllocation: testCases[0][1].toString(),
          newAllocation: testCases[0][2].toString(),
          epochNumber: testCases[0][3].toString(),
        },
        addresses: [mockNetworkManager.liquidityModule]
      }),
    ]);
  });

  it("should not detect a large newAllocation event from an incorrect contract", async () => {
    const wrongContract: string = createAddress("0xd34d");

    const testTopics = encodeParameter("address", testCases[1][0]);
    const testData = encodeParameters(
      ["uint256", "uint256", "uint256"],
      [testCases[1][1], testCases[1][2], testCases[1][3]]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(wrongContract)
      .setFrom(testSender)
      .addEventLog(SCHED_BORROW_ALLOC_CHANGE_SIG, wrongContract, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should not detect a newAllocation event with an amount below the threshold", async () => {
    const testTopics = encodeParameter("address", testCases[2][0]);
    const testData = encodeParameters(
      ["uint256", "uint256", "uint256"],
      [testCases[2][1], testCases[2][2], testCases[2][3]]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testSender)
      .addEventLog(SCHED_BORROW_ALLOC_CHANGE_SIG, mockNetworkManager.liquidityModule, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect multiple large newAllocation event emissions", async () => {
    // Greater than threshold
    const testTopicsOne = encodeParameter("address", testCases[3][0]);
    const testDataOne = encodeParameters(
      ["uint256", "uint256", "uint256"],
      [testCases[3][1], testCases[3][2], testCases[3][3]]
    );

    // Less than threshold. Should not be detected in findings
    const testTopicsTwo = encodeParameter("address", testCases[4][0]);
    const testDataTwo = encodeParameters(
      ["uint256", "uint256", "uint256"],
      [testCases[4][1], testCases[4][2], testCases[4][3]]
    );

    // Greater than threshold
    const testTopicsThree = encodeParameter("address", testCases[5][0]);
    const testDataThree = encodeParameters(
      ["uint256", "uint256", "uint256"],
      [testCases[5][1], testCases[5][2], testCases[5][3]]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testSender)
      .addEventLog(SCHED_BORROW_ALLOC_CHANGE_SIG, mockNetworkManager.liquidityModule, testDataOne, testTopicsOne)
      .addEventLog(SCHED_BORROW_ALLOC_CHANGE_SIG, mockNetworkManager.liquidityModule, testDataTwo, testTopicsTwo)
      .addEventLog(SCHED_BORROW_ALLOC_CHANGE_SIG, mockNetworkManager.liquidityModule, testDataThree, testTopicsThree);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Large borrower allocation detected on dYdX perpetual exchange.",
        description: "ScheduledBorrowerAllocationChange event emitted with a large newAllocation",
        alertId: "DYDX-16",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          borrower: testCases[3][0],
          oldAllocation: testCases[3][1].toString(),
          newAllocation: testCases[3][2].toString(),
          epochNumber: testCases[3][3].toString(),
        },
        addresses: [mockNetworkManager.liquidityModule]
      }),
      Finding.fromObject({
        name: "Large borrower allocation detected on dYdX perpetual exchange.",
        description: "ScheduledBorrowerAllocationChange event emitted with a large newAllocation",
        alertId: "DYDX-16",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          borrower: testCases[5][0],
          oldAllocation: testCases[5][1].toString(),
          newAllocation: testCases[5][2].toString(),
          epochNumber: testCases[5][3].toString(),
        },
        addresses: [mockNetworkManager.liquidityModule]
      }),
    ]);
  });

  it("should not detect an incorrect event from the correct contract", async () => {
    const wrongContract: string = createAddress("0xd34d");

    const testTopics = encodeParameter("address", testCases[1][0]);
    const testData = encodeParameters(
      ["uint256", "uint256", "uint256"],
      [testCases[1][1], testCases[1][2], testCases[1][3]]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(wrongContract)
      .setFrom(testSender)
      .addEventLog(SCHED_BORROW_ALLOC_CHANGE_SIG, wrongContract, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
