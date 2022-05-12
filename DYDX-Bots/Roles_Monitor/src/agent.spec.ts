import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { utils } from "ethers";
import { provideHandleTransaction } from "./agent";
import NetworkManager from "./network";
import { MODULE_IFACE } from "./utils";

const testSender: string = createAddress("0xad");

// Format: [role, previousAdminRole, newAdminRole][]
const roleChangedTestCases: [string, string, string][] = [
  [utils.keccak256("0xab11"), utils.keccak256("0xab12"), utils.keccak256("0xab13")],
  [utils.keccak256("0xac21"), utils.keccak256("0xac22"), utils.keccak256("0xac23")],
  [utils.keccak256("0xad31"), utils.keccak256("0xad32"), utils.keccak256("0xad33")],
];
// Format: [role, account, sender][]
const grantedAndRevokedTestCases: [string, string, string][] = [
  [utils.keccak256("0xfe11"), createAddress("0xab2"), createAddress("0xab3")],
  [utils.keccak256("0xfe12"), createAddress("0xac2"), createAddress("0xac3")],
  [utils.keccak256("0xfe13"), createAddress("0xad2"), createAddress("0xad3")],
  [utils.keccak256("0xfe14"), createAddress("0xae2"), createAddress("0xae3")],
  [utils.keccak256("0xfe15"), createAddress("0xaf2"), createAddress("0xaf3")],
  [utils.keccak256("0xfe15"), createAddress("0xba2"), createAddress("0xba3")],
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

  it("should detect a RoleRevoked event emission from both the safety and liquidity modules", async () => {
    const RoleRevokedLogOne = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RoleRevoked"), [
      grantedAndRevokedTestCases[2][0],
      grantedAndRevokedTestCases[2][1],
      grantedAndRevokedTestCases[2][2],
    ]);

    const RoleRevokedLogTwo = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RoleRevoked"), [
      grantedAndRevokedTestCases[3][0],
      grantedAndRevokedTestCases[3][1],
      grantedAndRevokedTestCases[3][2],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.safetyModule)
      .setFrom(testSender)
      .addAnonymousEventLog(mockNetworkManager.safetyModule, RoleRevokedLogOne.data, ...RoleRevokedLogOne.topics)
      .addAnonymousEventLog(mockNetworkManager.liquidityModule, RoleRevokedLogTwo.data, ...RoleRevokedLogTwo.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Role has been revoked",
        description: "RoleRevoked event was emitted",
        alertId: "DYDX-18-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          role: grantedAndRevokedTestCases[2][0], // TYPE bytes32, NEED TO CONVERT TO STRING
          account: grantedAndRevokedTestCases[2][1],
          sender: grantedAndRevokedTestCases[2][2],
        },
        addresses: [mockNetworkManager.safetyModule],
      }),
      Finding.fromObject({
        name: "Role has been revoked",
        description: "RoleRevoked event was emitted",
        alertId: "DYDX-18-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          role: grantedAndRevokedTestCases[3][0], // TYPE bytes32, NEED TO CONVERT TO STRING
          account: grantedAndRevokedTestCases[3][1],
          sender: grantedAndRevokedTestCases[3][2],
        },
        addresses: [mockNetworkManager.liquidityModule],
      }),
    ]);
  });

  it("should not detect the events emitting from the incorrect contract", async () => {
    const wrongContract: string = createAddress("0xd34d");

    const RoleAdminChangedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RoleAdminChanged"), [
      roleChangedTestCases[0][0],
      roleChangedTestCases[0][1],
      roleChangedTestCases[0][2],
    ]);

    const EpochParamChangedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RoleGranted"), [
      grantedAndRevokedTestCases[0][0],
      grantedAndRevokedTestCases[0][1],
      grantedAndRevokedTestCases[0][2],
    ]);

    const RewardsPerSecondLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RoleRevoked"), [
      grantedAndRevokedTestCases[2][0],
      grantedAndRevokedTestCases[2][1],
      grantedAndRevokedTestCases[2][2],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(wrongContract)
      .setFrom(testSender)
      .addAnonymousEventLog(wrongContract, RoleAdminChangedLog.data, ...RoleAdminChangedLog.topics)
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
    const RoleAdminChangedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RoleAdminChanged"), [
      roleChangedTestCases[2][0],
      roleChangedTestCases[2][1],
      roleChangedTestCases[2][2],
    ]);

    const RoleGrantedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RoleGranted"), [
      grantedAndRevokedTestCases[4][0],
      grantedAndRevokedTestCases[4][1],
      grantedAndRevokedTestCases[4][2],
    ]);

    const RoleRevokedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("RoleRevoked"), [
      grantedAndRevokedTestCases[5][0],
      grantedAndRevokedTestCases[5][1],
      grantedAndRevokedTestCases[5][2],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.liquidityModule)
      .setFrom(testSender)
      .addAnonymousEventLog(mockNetworkManager.safetyModule, RoleAdminChangedLog.data, ...RoleAdminChangedLog.topics)
      .addAnonymousEventLog(mockNetworkManager.liquidityModule, RoleGrantedLog.data, ...RoleGrantedLog.topics)
      .addAnonymousEventLog(mockNetworkManager.safetyModule, RoleRevokedLog.data, ...RoleRevokedLog.topics);

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
          role: roleChangedTestCases[2][0],
          previousAdminRole: roleChangedTestCases[2][1],
          newAdminRole: roleChangedTestCases[2][2],
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
          role: grantedAndRevokedTestCases[4][0],
          account: grantedAndRevokedTestCases[4][1],
          sender: grantedAndRevokedTestCases[4][2],
        },
        addresses: [mockNetworkManager.liquidityModule],
      }),
      Finding.fromObject({
        name: "Role has been revoked",
        description: "RoleRevoked event was emitted",
        alertId: "DYDX-18-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          role: grantedAndRevokedTestCases[5][0], // TYPE bytes32, NEED TO CONVERT TO STRING
          account: grantedAndRevokedTestCases[5][1],
          sender: grantedAndRevokedTestCases[5][2],
        },
        addresses: [mockNetworkManager.safetyModule],
      }),
    ]);
  });
});
