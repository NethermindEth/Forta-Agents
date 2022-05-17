import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { utils } from "ethers";
import { provideHandleTransaction } from "./agent";
import NetworkManager from "./network";
import { MODULE_IFACE } from "./utils";

const testSender: string = createAddress("0xad");

export const testRolesMap: Record<string, string> = {
  "0x09659e0aa12c56a3dece97692f0f23fc8f2825f9ffaa3b75428e4726cdf2a814": "OWNER_ROLE", // "0xab11"
  "0x5e620be0f7c67873fd132b7805b9bacd22770701962c4441433f6d572e09ac4c": "EPOCH_PARAMETERS_ROLE", // "0xab12"
  "0xa4efcdbe0a4517e5f06e41c280c2685b29d3072f17b8ccb5ff92066a2a07f6de": "REWARDS_RATE_ROLE", // "0xab13"
  "0x5a88a442e34c11687eb5944a8cd22b8238668156fa17d16580838a3b9e6c0c19": "BORROWER_ADMIN_ROLE", // "0xac21"
  "0x71605e6bd15336ca6d608097000be252db45c93857c39479aaa8e66a40316928": "CLAIM_OPERATOR_ROLE", // "0xac22"
  "0x15887ddf60e2e6b78e963b6dd4e93041dc8206450f1baa784eb0f6d704a44149": "STAKE_OPERATOR_ROLE", // "0xac23"
  "0x514259bf2ff5d81df8bc4e02c421a05a287059ba14139e5620375140809e91e1": "DEBT_OPERATOR_ROLE", // "0xad31"
  "0x54a8c0ab653c15bfb48b47fd011ba2b9617af01cb45cab344acd57c924d56798": "NONE", // "0x0000"
  "0x673fbecda3bfdf1adbf9e5f658c0f5ee475166da8b4bcc9fd0b5d6dd0e82e0bd": "SLASHER_ROLE", // "0xad32"
};

const roleChangedTestCases: [string, string, string][] = [
  [utils.keccak256("0xab11"), utils.keccak256("0xab12"), utils.keccak256("0xab13")],
  [utils.keccak256("0xac21"), utils.keccak256("0xac22"), utils.keccak256("0xac23")],
  [utils.keccak256("0xad31"), utils.keccak256("0x0000"), utils.keccak256("0xad32")],
];
// Format: [role, account, sender][]
const grantedAndRevokedTestCases: [string, string, string][] = [
  [utils.keccak256("0xab11"), createAddress("0xab2"), createAddress("0xab3")],
  [utils.keccak256("0xab12"), createAddress("0xac2"), createAddress("0xac3")],
  [utils.keccak256("0xab13"), createAddress("0xad2"), createAddress("0xad3")],
  [utils.keccak256("0xac21"), createAddress("0xae2"), createAddress("0xae3")],
  [utils.keccak256("0xac22"), createAddress("0xaf2"), createAddress("0xaf3")],
  [utils.keccak256("0xac23"), createAddress("0xba2"), createAddress("0xba3")],
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
    handleTransaction = provideHandleTransaction(mockNetworkManager, testRolesMap);
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
          role: testRolesMap[utils.keccak256("0xab11")],
          previousAdminRole: testRolesMap[utils.keccak256("0xab12")],
          newAdminRole: testRolesMap[utils.keccak256("0xab13")],
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
          role: testRolesMap[utils.keccak256("0xac21")],
          previousAdminRole: testRolesMap[utils.keccak256("0xac22")],
          newAdminRole: testRolesMap[utils.keccak256("0xac23")],
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
          role: testRolesMap[utils.keccak256("0xab11")],
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
          role: testRolesMap[utils.keccak256("0xab12")],
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
          role: testRolesMap[utils.keccak256("0xab13")],
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
          role: testRolesMap[utils.keccak256("0xac21")],
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
          role: testRolesMap[utils.keccak256("0xad31")],
          previousAdminRole: testRolesMap[utils.keccak256("0x0000")],
          newAdminRole: testRolesMap[utils.keccak256("0xad32")],
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
          role: testRolesMap[utils.keccak256("0xac22")],
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
          role: testRolesMap[utils.keccak256("0xac23")],
          account: grantedAndRevokedTestCases[5][1],
          sender: grantedAndRevokedTestCases[5][2],
        },
        addresses: [mockNetworkManager.safetyModule],
      }),
    ]);
  });
});
