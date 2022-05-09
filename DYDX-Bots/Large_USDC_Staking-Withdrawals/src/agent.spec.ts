import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber, utils } from "ethers";
import { provideHandleTransaction } from "./agent";
import { MODULE_IFACE, USDC_IFACE } from "./utils";
import BalanceFetcher from "./balance.fetcher";

const testModuleUsdcBalance: BigNumber = BigNumber.from("10000000000000000000"); // 10 USDC
const testThresholdPercentage: number = 20;
const testStaker: string = createAddress("0xac");
const testBlockNumbers: number[] = [2, 42, 92, 360, 444, 3500, 90210, 972011, 3524233];
const testAmounts: BigNumber[] = [
  BigNumber.from("5000000000000000000"), // 5 USDC
  BigNumber.from("6000000000000000000"), // 6 USDC
  BigNumber.from("7000000000000000000"), // 7 USDC
  BigNumber.from("8000000000000000000"), // 8 USDC
  BigNumber.from("9000000000000000000"), // 9 USDC
];
const testLowAmounts: BigNumber[] = [
  BigNumber.from("1000000000000000"), // .001 USDC
  BigNumber.from("2000000000000000"), // .002 USDC
  BigNumber.from("3000000000000000"), // .003 USDC
  BigNumber.from("4000000000000000"), // .004 USDC
];

describe("Large Stake Token Deposit/Withdrawal Test Suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockData: any = {
    networkManager: {
      liquidityModule: createAddress("0xab"),
      usdcAddress: createAddress("0xad"),
      setNetwork: jest.fn(),
    },
  };
  const handleTransaction: HandleTransaction = provideHandleTransaction(mockData, testThresholdPercentage);

  const createBalanceOfCall = (moduleAddress: string, tokenAmount: BigNumber, blockNumber: number) => {
    mockProvider.addCallTo(mockData.networkManager.usdcAddress, blockNumber, USDC_IFACE, "balanceOf", {
      inputs: [moduleAddress],
      outputs: [tokenAmount],
    });
  };

  beforeAll(() => {
    mockData.balanceFetcher = new BalanceFetcher(mockProvider as any, mockData.networkManager);
  });

  beforeEach(() => {
    mockProvider.clear();
  });

  it("should return 0 findings in empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect a large Staked event", async () => {
    createBalanceOfCall(mockData.networkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[0] - 1);
    const testSpender: string = createAddress("0x1");

    const StakedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Staked"), [
      testStaker,
      testSpender,
      testAmounts[0],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockData.networkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[0])
      .addAnonymousEventLog(mockData.networkManager.liquidityModule, StakedLog.data, ...StakedLog.topics);

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
    createBalanceOfCall(mockData.networkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[1] - 1);
    const testSpender: string = createAddress("0x2");

    const StakedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Staked"), [
      testStaker,
      testSpender,
      testLowAmounts[0],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockData.networkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[1])
      .addAnonymousEventLog(mockData.networkManager.liquidityModule, StakedLog.data, ...StakedLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect a large WithdrewStake event", async () => {
    createBalanceOfCall(mockData.networkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[2] - 1);
    const testRecipient: string = createAddress("0x3");

    const WithdrewStakeLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("WithdrewStake"), [
      testStaker,
      testRecipient,
      testAmounts[1],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockData.networkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[2])
      .addAnonymousEventLog(mockData.networkManager.liquidityModule, WithdrewStakeLog.data, ...WithdrewStakeLog.topics);

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
    createBalanceOfCall(mockData.networkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[3] - 1);
    const testRecipient: string = createAddress("0x4");

    const WithdrewStakeLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("WithdrewStake"), [
      testStaker,
      testRecipient,
      testLowAmounts[1],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockData.networkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[3])
      .addAnonymousEventLog(mockData.networkManager.liquidityModule, WithdrewStakeLog.data, ...WithdrewStakeLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect a large WithdrewDebt event", async () => {
    createBalanceOfCall(mockData.networkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[4] - 1);
    const testRecipient: string = createAddress("0x5");
    const testNewDebtBal: BigNumber = BigNumber.from("3000000000000000000"); // 3 USDC

    const WithdrewDebtLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("WithdrewDebt"), [
      testStaker,
      testRecipient,
      testAmounts[2],
      testNewDebtBal,
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockData.networkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[4])
      .addAnonymousEventLog(mockData.networkManager.liquidityModule, WithdrewDebtLog.data, ...WithdrewDebtLog.topics);

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
    createBalanceOfCall(mockData.networkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[5] - 1);
    const testRecipient: string = createAddress("0x6");
    const testNewDebtBal: BigNumber = BigNumber.from("4000000000000000000"); // 4 USDC

    const WithdrewDebtLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("WithdrewDebt"), [
      testStaker,
      testRecipient,
      testLowAmounts[2],
      testNewDebtBal,
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockData.networkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[5])
      .addAnonymousEventLog(mockData.networkManager.liquidityModule, WithdrewDebtLog.data, ...WithdrewDebtLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect both a large Staked event and large WithdrewStake event, and not detect WithdrewDebt for being too low", async () => {
    createBalanceOfCall(mockData.networkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[6] - 1);
    const testSpender: string = createAddress("0x7");
    const testRecipient: string = createAddress("0x8");
    const testNewDebtBal: BigNumber = BigNumber.from("5000000000000000000"); // 5 USDC

    const StakedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Staked"), [
      testStaker,
      testSpender,
      testAmounts[3],
    ]);

    // Should not detect this due to amount being too low
    const WithdrewDebtLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("WithdrewDebt"), [
      testStaker,
      testRecipient,
      testLowAmounts[3],
      testNewDebtBal,
    ]);

    const WithdrewStakeLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("WithdrewStake"), [
      testStaker,
      testRecipient,
      testAmounts[4],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockData.networkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[6])
      .addAnonymousEventLog(mockData.networkManager.liquidityModule, StakedLog.data, ...StakedLog.topics)
      .addAnonymousEventLog(mockData.networkManager.liquidityModule, WithdrewDebtLog.data, ...WithdrewDebtLog.topics)
      .addAnonymousEventLog(mockData.networkManager.liquidityModule, WithdrewStakeLog.data, ...WithdrewStakeLog.topics);

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
    createBalanceOfCall(mockData.networkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[7] - 1);
    const wrongIFace = new utils.Interface(["event WrongEvent()"]);
    const wrongLog = wrongIFace.encodeEventLog(
      wrongIFace.getEvent("WrongEvent"),
      []
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockData.networkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[7])
      .addAnonymousEventLog(mockData.networkManager.liquidityModule, wrongLog.data, ...wrongLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should not detect an event emission from the wrong contract", async () => {
    createBalanceOfCall(mockData.networkManager.liquidityModule, testModuleUsdcBalance, testBlockNumbers[8] - 1);
    const wrongModuleAddress: string = createAddress("0xd34d");
    const testSpender: string = createAddress("0x11");

    const StakedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Staked"), [
      testStaker,
      testSpender,
      testAmounts[0],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockData.networkManager.liquidityModule)
      .setFrom(testStaker)
      .setBlock(testBlockNumbers[8])
      .addAnonymousEventLog(wrongModuleAddress, StakedLog.data, ...StakedLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
