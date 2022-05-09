import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { encodeParameter, encodeParameters } from "forta-agent-tools";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { BigNumber, utils } from "ethers";
import { provideHandleTransaction } from "./agent";
import NetworkManager from "./network";
import { MODULE_IFACE } from "./utils";

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

  const mockNetworkManager: NetworkManager = {
    safetyModule: createAddress("0xab"),
    liquidityModule: createAddress("0xac"),
    setNetwork: jest.fn(),
  };

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(mockNetworkManager);
  });

  it("should return 0 findings in empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect a BlackoutWindowChanged event emission from both the safety and liquidity modules", async () => {
    const BlackoutWindowLogOne = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("BlackoutWindowChanged"), [
      testCases[0],
    ]);

    const BlackoutWindowLogTwo = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("BlackoutWindowChanged"), [
      testCases[1],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.safetyModule)
      .setFrom(testSender)
      .addAnonymousEventLog(mockNetworkManager.safetyModule, BlackoutWindowLogOne.data, ...BlackoutWindowLogOne.topics)
      .addAnonymousEventLog(
        mockNetworkManager.liquidityModule,
        BlackoutWindowLogTwo.data,
        ...BlackoutWindowLogTwo.topics
      );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Blackout window has changed",
        description: "BlackoutWindowChanged event was emitted",
        alertId: "DYDX-17-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          blackoutWindow: testCases[0].toString(),
        },
        addresses: [mockNetworkManager.safetyModule],
      }),
      Finding.fromObject({
        name: "Blackout window has changed",
        description: "BlackoutWindowChanged event was emitted",
        alertId: "DYDX-17-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          blackoutWindow: testCases[1].toString(),
        },
        addresses: [mockNetworkManager.liquidityModule],
      }),
    ]);
  });

  it("should detect a EpochParametersChanged event emission from both the safety and liquidity modules", async () => {
    const EpochParamChangedLogOne = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("EpochParametersChanged"), [
      [testCases[2], testCases[3]],
    ]);

    const EpochParamChangedLogTwo = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("EpochParametersChanged"), [
      [testCases[4], testCases[5]],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.safetyModule)
      .setFrom(testSender)
      .addAnonymousEventLog(
        mockNetworkManager.safetyModule,
        EpochParamChangedLogOne.data,
        ...EpochParamChangedLogOne.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.liquidityModule,
        EpochParamChangedLogTwo.data,
        ...EpochParamChangedLogTwo.topics
      );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Epoch parameters have changed",
        description: "EpochParametersChanged event was emitted",
        alertId: "DYDX-17-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          interval: testCases[2].toString(),
          offset: testCases[3].toString(),
        },
        addresses: [mockNetworkManager.safetyModule],
      }),
      Finding.fromObject({
        name: "Epoch parameters have changed",
        description: "EpochParametersChanged event was emitted",
        alertId: "DYDX-17-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          interval: testCases[4].toString(),
          offset: testCases[5].toString(),
        },
        addresses: [mockNetworkManager.liquidityModule],
      }),
    ]);
  });

  it("should detect a RewardsPerSecondUpdated event emission from both the safety and liquidity modules", async () => {
    const RewardsPerSecondLogOne = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RewardsPerSecondUpdated"), [
      testCases[6],
    ]);

    const RewardsPerSecondLogTwo = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RewardsPerSecondUpdated"), [
      testCases[7],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.safetyModule)
      .setFrom(testSender)
      .addAnonymousEventLog(
        mockNetworkManager.safetyModule,
        RewardsPerSecondLogOne.data,
        ...RewardsPerSecondLogOne.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.liquidityModule,
        RewardsPerSecondLogTwo.data,
        ...RewardsPerSecondLogTwo.topics
      );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Rewards per second have been updated",
        description: "RewardsPerSecondUpdated event was emitted",
        alertId: "DYDX-17-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          emissionPerSecond: testCases[6].toString(),
        },
        addresses: [mockNetworkManager.safetyModule],
      }),
      Finding.fromObject({
        name: "Rewards per second have been updated",
        description: "RewardsPerSecondUpdated event was emitted",
        alertId: "DYDX-17-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          emissionPerSecond: testCases[7].toString(),
        },
        addresses: [mockNetworkManager.liquidityModule],
      }),
    ]);
  });

  it("should not detect the events emitting from the incorrect contract", async () => {
    const wrongContract: string = createAddress("0xd34d");

    const BlackoutWindowLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("BlackoutWindowChanged"), [
      testCases[8],
    ]);

    const EpochParamChangedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("EpochParametersChanged"), [
      [testCases[9], testCases[10]],
    ]);

    const RewardsPerSecondLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RewardsPerSecondUpdated"), [
      testCases[11],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(wrongContract)
      .setFrom(testSender)
      .addAnonymousEventLog(wrongContract, BlackoutWindowLog.data, ...BlackoutWindowLog.topics)
      .addAnonymousEventLog(wrongContract, EpochParamChangedLog.data, ...EpochParamChangedLog.topics)
      .addAnonymousEventLog(wrongContract, RewardsPerSecondLog.data, ...RewardsPerSecondLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should not detect another event emission from either the safety nor liquidity modules", async () => {
    const wrongIFace = new utils.Interface(["event WrongEvent()"]);
    const wrongLog = wrongIFace.encodeEventLog(wrongIFace.getEvent("WrongEvent"), []);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.safetyModule)
      .setFrom(testSender)
      .addAnonymousEventLog(mockNetworkManager.safetyModule, wrongLog.data, ...wrongLog.topics)
      .addAnonymousEventLog(mockNetworkManager.liquidityModule, wrongLog.data, ...wrongLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should detect various combinations of event emissions and module contracts", async () => {
    const BlackoutWindowLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("BlackoutWindowChanged"), [
      testCases[14],
    ]);

    const EpochParamChangedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("EpochParametersChanged"), [
      [testCases[15], testCases[16]],
    ]);

    const RewardsPerSecondLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RewardsPerSecondUpdated"), [
      testCases[17],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testSender)
      .addAnonymousEventLog(mockNetworkManager.safetyModule, BlackoutWindowLog.data, ...BlackoutWindowLog.topics)
      .addAnonymousEventLog(
        mockNetworkManager.liquidityModule,
        EpochParamChangedLog.data,
        ...EpochParamChangedLog.topics
      )
      .addAnonymousEventLog(mockNetworkManager.safetyModule, RewardsPerSecondLog.data, ...RewardsPerSecondLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Blackout window has changed",
        description: "BlackoutWindowChanged event was emitted",
        alertId: "DYDX-17-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          blackoutWindow: testCases[14].toString(),
        },
        addresses: [mockNetworkManager.safetyModule],
      }),
      Finding.fromObject({
        name: "Epoch parameters have changed",
        description: "EpochParametersChanged event was emitted",
        alertId: "DYDX-17-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          interval: testCases[15].toString(),
          offset: testCases[16].toString(),
        },
        addresses: [mockNetworkManager.liquidityModule],
      }),
      Finding.fromObject({
        name: "Rewards per second have been updated",
        description: "RewardsPerSecondUpdated event was emitted",
        alertId: "DYDX-17-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          emissionPerSecond: testCases[17].toString(),
        },
        addresses: [mockNetworkManager.safetyModule],
      }),
    ]);
  });
});
