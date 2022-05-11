import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { BigNumber, utils } from "ethers";
import { provideHandleTransaction } from "./agent";
import NetworkManager from "./network";
import { MODULE_IFACE } from "./utils";

const testSender: string = createAddress("0xad");

// Format: [role, previousAdminRole, newAdminRole][]
const roleChangedTestCases: [string, string, string][] = [
  [utils.keccak256("0xab11"), utils.keccak256("0xab12"), utils.keccak256("0xab13")],
  [utils.keccak256("0xac21"), utils.keccak256("0xac22"), utils.keccak256("0xac23")],
];
// Format: [role, account, sender][]
const grantedAndRevokedTestCases: [string, string, string][] = [
  [utils.keccak256("0xfe11"), createAddress("0xab2"), createAddress("0xab3")],
  [utils.keccak256("0xfe12"), createAddress("0xac2"), createAddress("0xac3")],
];

describe("Roles Changes Monitor Test Suite", () => {
  let handleTransaction: HandleTransaction;

  const mockNetworkManager: NetworkManager = {
    safetyModule: createAddress("0xab"),
    liquidityModule: createAddress("0xac"),
    networkMap: {},
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

  it("should detect a RoleAdminChanged event emission from both the safety and liquidity modules", async () => {
    const RoleAdminChangedLogOne = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RoleAdminChanged"), [
      roleChangedTestCases[0][0],
      roleChangedTestCases[0][1],
      roleChangedTestCases[0][2],
    ]);

    const RoleAdminChangedLogTwo = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RoleAdminChanged"), [
      roleChangedTestCases[1][0],
      roleChangedTestCases[1][1],
      roleChangedTestCases[1][2],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.safetyModule)
      .setFrom(testSender)
      .addAnonymousEventLog(
        mockNetworkManager.safetyModule,
        RoleAdminChangedLogOne.data,
        ...RoleAdminChangedLogOne.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.liquidityModule,
        RoleAdminChangedLogTwo.data,
        ...RoleAdminChangedLogTwo.topics
      );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Admin role has changed",
        description: "RoleAdminChanged event was emitted",
        alertId: "DYDX-18-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          role: roleChangedTestCases[0][0],
          previousAdminRole: roleChangedTestCases[0][1],
          newAdminRole: roleChangedTestCases[0][2],
        },
        addresses: [mockNetworkManager.safetyModule],
      }),
      Finding.fromObject({
        name: "Admin role has changed",
        description: "RoleAdminChanged event was emitted",
        alertId: "DYDX-18-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          role: roleChangedTestCases[1][0],
          previousAdminRole: roleChangedTestCases[1][1],
          newAdminRole: roleChangedTestCases[1][2],
        },
        addresses: [mockNetworkManager.liquidityModule],
      }),
    ]);
  });

  it("should detect a RoleGranted event emission from both the safety and liquidity modules", async () => {
    const RoleGrantedLogOne = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RoleGranted"), [
      grantedAndRevokedTestCases[0][0],
      grantedAndRevokedTestCases[0][1],
      grantedAndRevokedTestCases[0][2],
    ]);

    const RoleGrantedLogTwo = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RoleGranted"), [
      grantedAndRevokedTestCases[1][0],
      grantedAndRevokedTestCases[1][1],
      grantedAndRevokedTestCases[1][2],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.safetyModule)
      .setFrom(testSender)
      .addAnonymousEventLog(mockNetworkManager.safetyModule, RoleGrantedLogOne.data, ...RoleGrantedLogOne.topics)
      .addAnonymousEventLog(mockNetworkManager.liquidityModule, RoleGrantedLogTwo.data, ...RoleGrantedLogTwo.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Role has been granted",
        description: "RoleGranted event was emitted",
        alertId: "DYDX-18-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          role: grantedAndRevokedTestCases[0][0],
          account: grantedAndRevokedTestCases[0][1],
          sender: grantedAndRevokedTestCases[0][2],
        },
        addresses: [mockNetworkManager.safetyModule],
      }),
      Finding.fromObject({
        name: "Role has been granted",
        description: "RoleGranted event was emitted",
        alertId: "DYDX-18-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          role: grantedAndRevokedTestCases[1][0],
          account: grantedAndRevokedTestCases[1][1],
          sender: grantedAndRevokedTestCases[1][2],
        },
        addresses: [mockNetworkManager.liquidityModule],
      }),
    ]);
  });

  /*
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
  */
});
