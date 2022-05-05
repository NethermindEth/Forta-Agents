import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { encodeParameter, encodeParameters } from "forta-agent-tools";
import { createAddress, TestTransactionEvent, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { provideHandleTransaction } from "./agent";
import NetworkManager from "./network";
import { STAKED_SIG, WITHDREW_STAKE_SIG, WITHDREW_DEBT_SIG, USDC_IFACE } from "./utils";
import BalanceFetcher from "./balance.fetcher";

const testModuleUsdcBalance: BigNumber = BigNumber.from("10000000000000000000"); // 10
const testThresholdPercentage: number = 20;
const testStaker: string = createAddress("0xac");
const testBlockNumbers: number[] = [2, 42, 92, 360, 444, 3500, 90210, 972011, 3524233];
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
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager: NetworkManager = {
    liquidityModule: createAddress("0xab"),
    usdcAddress: createAddress("0xad"),
    setNetwork: jest.fn(),
  };
  const balanceFetcher: BalanceFetcher = new BalanceFetcher(mockProvider as any);
  const handleTransaction: HandleTransaction = provideHandleTransaction(
    mockNetworkManager,
    balanceFetcher,
    testThresholdPercentage
  );

  const createBalanceOfCall = (moduleAddress: string, tokenAmount: BigNumber, blockNumber: number) => {
    mockProvider.addCallTo(mockNetworkManager.usdcAddress, blockNumber, USDC_IFACE, "balanceOf", {
      inputs: [moduleAddress],
      outputs: [tokenAmount],
    });
  };

  beforeEach(() => {
    mockProvider.clear();
  });

  it("should return 0 findings in empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect a large Staked event", async () => {
    createBalanceOfCall(mockNetworkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[0] - 1);
    const testSpender: string = createAddress("0x1");

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(["address", "uint256"], [testSpender, testAmounts[0]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[0])
      .addEventLog(STAKED_SIG, mockNetworkManager.liquidityModule, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Large stake on Liquidity Module contract",
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
    createBalanceOfCall(mockNetworkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[1] - 1);
    const testSpender: string = createAddress("0x2");

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(["address", "uint256"], [testSpender, testLowAmounts[0]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[1])
      .addEventLog(STAKED_SIG, mockNetworkManager.liquidityModule, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect a large WithdrewStake event", async () => {
    createBalanceOfCall(mockNetworkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[2] - 1);
    const testRecipient: string = createAddress("0x3");

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(["address", "uint256"], [testRecipient, testAmounts[1]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[2])
      .addEventLog(WITHDREW_STAKE_SIG, mockNetworkManager.liquidityModule, testData, testTopics);

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
    createBalanceOfCall(mockNetworkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[3] - 1);
    const testRecipient: string = createAddress("0x4");

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(["address", "uint256"], [testRecipient, testLowAmounts[1]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[3])
      .addEventLog(WITHDREW_STAKE_SIG, mockNetworkManager.liquidityModule, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect a large WithdrewDebt event", async () => {
    createBalanceOfCall(mockNetworkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[4] - 1);
    const testRecipient: string = createAddress("0x5");
    const testNewDebtBal: BigNumber = BigNumber.from("3000000000000000000"); // 3

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(
      ["address", "uint256", "uint256"],
      [testRecipient, testAmounts[2], testNewDebtBal]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[4])
      .addEventLog(WITHDREW_DEBT_SIG, mockNetworkManager.liquidityModule, testData, testTopics);

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
    createBalanceOfCall(mockNetworkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[5] - 1);
    const testRecipient: string = createAddress("0x6");
    const testNewDebtBal: BigNumber = BigNumber.from("4000000000000000000"); // 4

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(
      ["address", "uint256", "uint256"],
      [testRecipient, testLowAmounts[2], testNewDebtBal]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[5])
      .addEventLog(WITHDREW_DEBT_SIG, mockNetworkManager.liquidityModule, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect both a large Staked event and large WithdrewStake event", async () => {
    createBalanceOfCall(mockNetworkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[6] - 1);
    const testSpender: string = createAddress("0x7");
    const testRecipient: string = createAddress("0x8");
    const testNewDebtBal: BigNumber = BigNumber.from("5000000000000000000"); // 5

    const testStakedTopics = encodeParameter("address", testStaker);
    const testStakedData = encodeParameters(["address", "uint256"], [testSpender, testAmounts[3]]);

    // Should not detect this to amount being too low
    const testWithdrewDebtTopics = encodeParameter("address", testStaker);
    const testWithdrewDebtData = encodeParameters(
      ["address", "uint256", "uint256"],
      [testRecipient, testLowAmounts[3], testNewDebtBal]
    );

    const testWithdrewStakeTopics = encodeParameter("address", testStaker);
    const testWithdrewStakeData = encodeParameters(["address", "uint256"], [testRecipient, testAmounts[4]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[6])
      .addEventLog(STAKED_SIG, mockNetworkManager.liquidityModule, testStakedData, testStakedTopics)
      .addEventLog(WITHDREW_DEBT_SIG, mockNetworkManager.liquidityModule, testWithdrewDebtData, testWithdrewDebtTopics)
      .addEventLog(
        WITHDREW_STAKE_SIG,
        mockNetworkManager.liquidityModule,
        testWithdrewStakeData,
        testWithdrewStakeTopics
      );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: `Large stake on Liquidity Module contract`,
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
    createBalanceOfCall(mockNetworkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[7] - 1);
    const testSpender: string = createAddress("0x9");

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(["address", "uint256"], [testSpender, testAmounts[0]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[7])
      .addEventLog("wrongSig", mockNetworkManager.liquidityModule, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should not detect an event emission from the wrong contract", async () => {
    createBalanceOfCall(mockNetworkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[8] - 1);
    const wrongModuleAddress: string = createAddress("0xd34d");
    const testSpender: string = createAddress("0x11");

    const testTopics = encodeParameter("address", testStaker);
    const testData = encodeParameters(["address", "uint256"], [testSpender, testAmounts[0]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[8])
      .addEventLog(STAKED_SIG, wrongModuleAddress, testData, testTopics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
