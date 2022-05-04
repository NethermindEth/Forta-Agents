import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { encodeParameter, encodeParameters } from "forta-agent-tools";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { provideHandleTransaction } from "./agent";
import { BLACKOUT_WINDOW_CHANGED_SIG, EPOCH_PARAMS_CHANGED_SIG, REWARDS_PER_SECOND_UPDATED_SIG } from "./utils";

const testSafetyModule: string = createAddress("0xab");
const testLiquidityModule: string = createAddress("0xac");
const testModuleAddresses: string[] = [testSafetyModule, testLiquidityModule];

const testSender: string = createAddress("0xad");

const testCases: BigNumber[] = [
  BigNumber.from("100000000000000000000"), // 100
  BigNumber.from("150000000000000000000"), // 150
  BigNumber.from("200000000000000000000"), // 200
  BigNumber.from("250000000000000000000"), // 250
  BigNumber.from("300000000000000000000"), // 300
  BigNumber.from("350000000000000000000"), // 350
  BigNumber.from("400000000000000000000"), // 400
  BigNumber.from("450000000000000000000"), // 450
  BigNumber.from("500000000000000000000"), // 500
  BigNumber.from("550000000000000000000"), // 550
  BigNumber.from("600000000000000000000"), // 600
  BigNumber.from("650000000000000000000"), // 650
  BigNumber.from("700000000000000000000"), // 700
  BigNumber.from("750000000000000000000"), // 750
  BigNumber.from("800000000000000000000"), // 800
  BigNumber.from("850000000000000000000"), // 850
  BigNumber.from("900000000000000000000"), // 900
  BigNumber.from("950000000000000000000"), // 950
];

describe("Parameter Changes Monitor Test Suite", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(testModuleAddresses);
  });

  it("should return 0 findings in empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect a BlackoutWindowChanged event emission from both the safety and liquidity modules", async () => {
    const testDataOne = encodeParameter("uint256", testCases[0]);
    const testDataTwo = encodeParameter("uint256", testCases[1]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testSafetyModule)
      .setFrom(testSender)
      .addEventLog(BLACKOUT_WINDOW_CHANGED_SIG, testSafetyModule, testDataOne)
      .addEventLog(BLACKOUT_WINDOW_CHANGED_SIG, testLiquidityModule, testDataTwo);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Blackout window has changed",
        description: `BlackoutWindowChanged event was emitted from the address ${testSafetyModule}`,
        alertId: "DYDX-17-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          blackoutWindow: testCases[0].toString(),
        },
      }),
      Finding.fromObject({
        name: "Blackout window has changed",
        description: `BlackoutWindowChanged event was emitted from the address ${testLiquidityModule}`,
        alertId: "DYDX-17-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          blackoutWindow: testCases[1].toString(),
        },
      }),
    ]);
  });

  it("should detect a EpochParametersChanged event emission from both the safety and liquidity modules", async () => {
    const testDataOne = encodeParameters(["uint128", "uint128"], [testCases[2], testCases[3]]);
    const testDataTwo = encodeParameters(["uint128", "uint128"], [testCases[4], testCases[5]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testSafetyModule)
      .setFrom(testSender)
      .addEventLog(EPOCH_PARAMS_CHANGED_SIG, testSafetyModule, testDataOne)
      .addEventLog(EPOCH_PARAMS_CHANGED_SIG, testLiquidityModule, testDataTwo);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Epoch parameters have changed",
        description: `EpochParametersChanged event was emitted from the address ${testSafetyModule}`,
        alertId: "DYDX-17-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          interval: testCases[2].toString(),
          offset: testCases[3].toString(),
        },
      }),
      Finding.fromObject({
        name: "Epoch parameters have changed",
        description: `EpochParametersChanged event was emitted from the address ${testLiquidityModule}`,
        alertId: "DYDX-17-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          interval: testCases[4].toString(),
          offset: testCases[5].toString(),
        },
      }),
    ]);
  });

  it("should detect a RewardsPerSecondUpdated event emission from both the safety and liquidity modules", async () => {
    const testDataOne = encodeParameter("uint256", testCases[6]);
    const testDataTwo = encodeParameter("uint256", testCases[7]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testSafetyModule)
      .setFrom(testSender)
      .addEventLog(REWARDS_PER_SECOND_UPDATED_SIG, testSafetyModule, testDataOne)
      .addEventLog(REWARDS_PER_SECOND_UPDATED_SIG, testLiquidityModule, testDataTwo);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Rewards per second have been updated",
        description: `RewardsPerSecondUpdated event was emitted from the address ${testSafetyModule}`,
        alertId: "DYDX-17-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          emissionPerSecond: testCases[6].toString(),
        },
      }),
      Finding.fromObject({
        name: "Rewards per second have been updated",
        description: `RewardsPerSecondUpdated event was emitted from the address ${testLiquidityModule}`,
        alertId: "DYDX-17-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          emissionPerSecond: testCases[7].toString(),
        },
      }),
    ]);
  });

  it("should not detect the events emitting from the incorrect contract", async () => {
    const wrongContract: string = createAddress("0xd34d");

    const testDataOne = encodeParameter("uint256", testCases[8]);
    const testDataTwo = encodeParameters(["uint128", "uint128"], [testCases[9], testCases[10]]);
    const testDataThree = encodeParameter("uint256", testCases[11]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(wrongContract)
      .setFrom(testSender)
      .addEventLog(BLACKOUT_WINDOW_CHANGED_SIG, wrongContract, testDataOne)
      .addEventLog(EPOCH_PARAMS_CHANGED_SIG, wrongContract, testDataTwo)
      .addEventLog(REWARDS_PER_SECOND_UPDATED_SIG, wrongContract, testDataThree);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should not detect another event emission from either the safety nor liquidity modules", async () => {
    const wrongEventSig: string = "wrongEvent(uint256)";
    const testDataOne = encodeParameter("uint256", testCases[12]);
    const testDataTwo = encodeParameter("uint256", testCases[13]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testSafetyModule)
      .setFrom(testSender)
      .addEventLog(wrongEventSig, testSafetyModule, testDataOne)
      .addEventLog(wrongEventSig, testLiquidityModule, testDataTwo);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect various combinations of event emissions and module contracts", async () => {
    const testDataOne = encodeParameter("uint256", testCases[14]);
    const testDataTwo = encodeParameters(["uint128", "uint128"], [testCases[15], testCases[16]]);
    const testDataThree = encodeParameter("uint256", testCases[17]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testLiquidityModule)
      .setFrom(testSender)
      .addEventLog(BLACKOUT_WINDOW_CHANGED_SIG, testSafetyModule, testDataOne)
      .addEventLog(EPOCH_PARAMS_CHANGED_SIG, testLiquidityModule, testDataTwo)
      .addEventLog(REWARDS_PER_SECOND_UPDATED_SIG, testSafetyModule, testDataThree);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Blackout window has changed",
        description: `BlackoutWindowChanged event was emitted from the address ${testSafetyModule}`,
        alertId: "DYDX-17-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          blackoutWindow: testCases[14].toString(),
        },
      }),
      Finding.fromObject({
        name: "Epoch parameters have changed",
        description: `EpochParametersChanged event was emitted from the address ${testLiquidityModule}`,
        alertId: "DYDX-17-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          interval: testCases[15].toString(),
          offset: testCases[16].toString(),
        },
      }),
      Finding.fromObject({
        name: "Rewards per second have been updated",
        description: `RewardsPerSecondUpdated event was emitted from the address ${testSafetyModule}`,
        alertId: "DYDX-17-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          emissionPerSecond: testCases[17].toString(),
        },
      }),
    ]);
  });
});
