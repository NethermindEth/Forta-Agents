import { FindingType, FindingSeverity, Finding, HandleTransaction, ethers, TransactionEvent } from "forta-agent";
import { encodeParameter, encodeParameters } from "forta-agent-tools";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { provideHandleTransaction } from "./agent";
import { STAKED_SIG, WITHDREW_STAKE_SIG, WITHDREW_DEBT_SIG } from "./utils";
import { when } from "jest-when";

const testBlockNumber: number = 2;
const testProxyAddr: string = createAddress("0xab");
const testProxyStakeTokenBalance: BigNumber = BigNumber.from("15000000000000000000"); // 15
const testThresholdPercentage: number = 20;
const testStaker: string = createAddress("0xac");
const testAmounts: BigNumber[] = [
  BigNumber.from("5000000000000000000"), // 5
  BigNumber.from("6000000000000000000"), // 6
  BigNumber.from("7000000000000000000"), // 7
  BigNumber.from("8000000000000000000"), // 8
  BigNumber.from("9000000000000000000"), // 9
];
const testLowAmounts: BigNumber[] = [
  BigNumber.from("1000000000000000"), // .001
  BigNumber.from("2000000000000000"), // .002
  BigNumber.from("3000000000000000"), // .003
  BigNumber.from("4000000000000000"), // .004
];

describe("Large Stake Token Deposit/Withdrawal Test Suite", () => {
  let handleTransaction: HandleTransaction;
  let mockFetcher: any;

  // CONFIRM beforeAll IS WHAT SHOULD BE USED
  // (VS. beforeEach, etc.)
  beforeAll(() => {
    mockFetcher = {
      getBalanceOf: jest.fn(),
    };
    when(mockFetcher.getBalanceOf)
      .calledWith(testProxyAddr, testBlockNumber - 1)
      .mockReturnValue(testProxyStakeTokenBalance);
    handleTransaction = provideHandleTransaction(testProxyAddr, mockFetcher, testThresholdPercentage);
  });

  it("should return 0 findings in empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect a large Staked event", async () => {
    const testSpender: string = createAddress("0x1");

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(["address", "uint256"], [testSpender, testAmounts[0]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testProxyAddr)
      .setFrom(testStaker)
      .setBlock(testBlockNumber)
      .addEventLog(STAKED_SIG, testProxyAddr, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Large stake on Liquidity Moudle contract",
        description: "Staked event was emitted in Liquidity Module contract with a large amount",
        alertId: "DYDX-14-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          staker: testStaker,
          spender: testSpender,
          amount: testAmounts[0].toString(),
        },
      }),
    ]);
  });

  it("should not detect a non-large Staked event", async () => {
    const testSpender: string = createAddress("0x2");

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(["address", "uint256"], [testSpender, testLowAmounts[0]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testProxyAddr)
      .setFrom(testStaker)
      .setBlock(testBlockNumber)
      .addEventLog(STAKED_SIG, testProxyAddr, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect a large WithdrewStake event", async () => {
    const testRecipient: string = createAddress("0x3");

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(["address", "uint256"], [testRecipient, testAmounts[1]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testProxyAddr)
      .setFrom(testStaker)
      .setBlock(testBlockNumber)
      .addEventLog(WITHDREW_STAKE_SIG, testProxyAddr, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Large stake withdrawal on Liquidity Module contract",
        description: "WithdrewStake event was emitted in Liquidity Module contract with a large amount",
        alertId: "DYDX-14-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          staker: testStaker.toLowerCase(),
          recipient: testRecipient.toLowerCase(),
          amount: testAmounts[1].toString(),
        },
      }),
    ]);
  });

  it("should not detect a non-large WithdrewStake event", async () => {
    const testRecipient: string = createAddress("0x4");

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(["address", "uint256"], [testRecipient, testLowAmounts[1]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testProxyAddr)
      .setFrom(testStaker)
      .setBlock(testBlockNumber)
      .addEventLog(WITHDREW_STAKE_SIG, testProxyAddr, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect a large withdrew debt event", async () => {
    const testRecipient: string = createAddress("0x5");
    const testNewDebtBal: BigNumber = BigNumber.from("3000000000000000000"); // 3

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(
      ["address", "uint256", "uint256"],
      [testRecipient, testAmounts[2], testNewDebtBal]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testProxyAddr)
      .setFrom(testStaker)
      .setBlock(testBlockNumber)
      .addEventLog(WITHDREW_DEBT_SIG, testProxyAddr, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Large debt withdrawal on Liquidity Module contract",
        description: "WithdrewDebt event was emitted in Liquidity Module contract with a large amount",
        alertId: "DYDX-14-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          staker: testStaker.toLowerCase(),
          recipient: testRecipient.toLowerCase(),
          amount: testAmounts[2].toString(),
          newDebtBalance: testNewDebtBal.toString(),
        },
      }),
    ]);
  });

  it("should not detect a non-large WithdrewDebt event", async () => {
    const testRecipient: string = createAddress("0x6");
    const testNewDebtBal: BigNumber = BigNumber.from("4000000000000000000"); // 4

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(
      ["address", "uint256", "uint256"],
      [testRecipient, testLowAmounts[2], testNewDebtBal]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testProxyAddr)
      .setFrom(testStaker)
      .setBlock(testBlockNumber)
      .addEventLog(WITHDREW_DEBT_SIG, testProxyAddr, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect both a large Staked event and large WithdrewStake event", async () => {
    const testSpender: string = createAddress("0x7");
    const testRecipient: string = createAddress("0x8");
    const testNewDebtBal: BigNumber = BigNumber.from("5000000000000000000"); // 5

    const testStakedTopics = encodeParameter("address", testStaker);
    const testStakedData = encodeParameters(["address", "uint256"], [testSpender, testAmounts[3]]);

    const testWithdrewDebtTopics = encodeParameter("address", testStaker);
    const testWithdrewDebtData = encodeParameters(
      ["address", "uint256", "uint256"],
      [testRecipient, testLowAmounts[3], testNewDebtBal]
    );

    const testWithdrewStakeTopics = encodeParameter("address", testStaker);
    const testWithdrewStakeData = encodeParameters(["address", "uint256"], [testRecipient, testAmounts[4]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testProxyAddr)
      .setFrom(testStaker)
      .setBlock(testBlockNumber)
      .addEventLog(STAKED_SIG, testProxyAddr, testStakedData, testStakedTopics)
      .addEventLog(WITHDREW_DEBT_SIG, testProxyAddr, testWithdrewDebtData, testWithdrewDebtTopics)
      .addEventLog(WITHDREW_STAKE_SIG, testProxyAddr, testWithdrewStakeData, testWithdrewStakeTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: `Large stake on Liquidity Moudle contract`,
        description: "Staked event was emitted in Liquidity Module contract with a large amount",
        alertId: "DYDX-14-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          staker: testStaker,
          spender: testSpender,
          amount: testAmounts[3].toString(),
        },
      }),
      Finding.fromObject({
        name: "Large stake withdrawal on Liquidity Module contract",
        description: "WithdrewStake event was emitted in Liquidity Module contract with a large amount",
        alertId: "DYDX-14-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          staker: testStaker.toLowerCase(),
          recipient: testRecipient.toLowerCase(),
          amount: testAmounts[4].toString(),
        },
      }),
    ]);
  });

  it("should not detect an incorrect event", async () => {
    const testSpender: string = createAddress("0x9");

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(["address", "uint256"], [testSpender, testAmounts[0]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testProxyAddr)
      .setFrom(testStaker)
      .setBlock(testBlockNumber)
      .addEventLog("wrongSig", testProxyAddr, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should not detect an event emission from the wrong contract", async () => {
    const wrongProxyAddress: string = createAddress("0xd34d");
    const testSpender: string = createAddress("0x11");

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(["address", "uint256"], [testSpender, testAmounts[0]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testProxyAddr)
      .setFrom(testStaker)
      .setBlock(testBlockNumber)
      .addEventLog(STAKED_SIG, wrongProxyAddress, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
