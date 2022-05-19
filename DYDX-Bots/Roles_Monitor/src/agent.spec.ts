import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { toUtf8Bytes, keccak256, Interface } from "ethers/lib/utils";
import { provideHandleTransaction } from "./agent";
import NetworkManager from "./network";
import { MODULE_IFACE } from "./utils";

const testSender: string = createAddress("0xad");

// toUtf8Bytes because ethers' keccak256 does not accept UTF-8 strings
export const testRolesMap: Record<string, string> = {
  "0x59239c7370f2f26b60f193117f4246cfc4198c571327aa0745e3b0eb8e4ce8ad": toUtf8Bytes("ROLE_ONE").toString(),
  "0x7a475f1d19790fc1e1a8d217d16afd2b36d1c2ead2c704b4d45ca524d8d4151f": toUtf8Bytes("ROLE_TWO").toString(),
  "0x1216c06236b0509106ff0db218d51c29d4dd73c8d766a0a855d48f26a72bd509": toUtf8Bytes("ROLE_THREE").toString(),
  "0x34183da302cdf3015f4685a429c3ccdb3e4bc8ee2e9ea12767f53b0272353a38": toUtf8Bytes("ROLE_FOUR").toString(),
  "0x2f0d35b3eff92f1d4872a30a20b134f102408c63d4a0ed1bae745a6ee3419e79": toUtf8Bytes("ROLE_FIVE").toString(),
  "0x68e76ddc4c766d7337efe8c6ef6d3b507dace45001493f524a945af86cf5c3f8": toUtf8Bytes("ROLE_SIX").toString(),
  "0x44c82c18ca74f9cde7288d5499ba7218137286a1559f5566f7ade32ae2e86c8f": toUtf8Bytes("ROLE_SEVEN").toString(),
  "0x5c30025ef80806ec13e8b803253eeb9b45e86b29a54fb081fc0e961af339841e": toUtf8Bytes("ROLE_EIGHT").toString(),
  "0xe1003109f7aec8c20e200acc4e11c3db489e52cc9b54b414d4261f089ff4ba64": toUtf8Bytes("ROLE_NINE").toString(),
};

// utils.toUtf8Bytes("ROLE_ONE")
const roleChangedTestCases: [string, string, string][] = [
  [keccak256(toUtf8Bytes("ROLE_ONE")), keccak256(toUtf8Bytes("ROLE_TWO")), keccak256(toUtf8Bytes("ROLE_THREE"))],
  [keccak256(toUtf8Bytes("ROLE_FOUR")), keccak256(toUtf8Bytes("ROLE_FIVE")), keccak256(toUtf8Bytes("ROLE_SIX"))],
  [keccak256(toUtf8Bytes("ROLE_SEVEN")), keccak256(toUtf8Bytes("ROLE_EIGHT")), keccak256(toUtf8Bytes("ROLE_NINE"))],
];
// Format: [role, account, sender][]
const grantedAndRevokedTestCases: [string, string, string][] = [
  [keccak256(toUtf8Bytes("ROLE_ONE")), createAddress("0xab2"), createAddress("0xab3")],
  [keccak256(toUtf8Bytes("ROLE_TWO")), createAddress("0xac2"), createAddress("0xac3")],
  [keccak256(toUtf8Bytes("ROLE_THREE")), createAddress("0xad2"), createAddress("0xad3")],
  [keccak256(toUtf8Bytes("ROLE_FOUR")), createAddress("0xae2"), createAddress("0xae3")],
  [keccak256(toUtf8Bytes("ROLE_FIVE")), createAddress("0xaf2"), createAddress("0xaf3")],
  [keccak256(toUtf8Bytes("ROLE_SIX")), createAddress("0xba2"), createAddress("0xba3")],
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
          role: testRolesMap[keccak256(toUtf8Bytes("ROLE_ONE"))],
          previousAdminRole: testRolesMap[keccak256(toUtf8Bytes("ROLE_TWO"))],
          newAdminRole: testRolesMap[keccak256(toUtf8Bytes("ROLE_THREE"))],
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
          role: testRolesMap[keccak256(toUtf8Bytes("ROLE_FOUR"))],
          previousAdminRole: testRolesMap[keccak256(toUtf8Bytes("ROLE_FIVE"))],
          newAdminRole: testRolesMap[keccak256(toUtf8Bytes("ROLE_SIX"))],
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
          role: testRolesMap[keccak256(toUtf8Bytes("ROLE_ONE"))],
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
          role: testRolesMap[keccak256(toUtf8Bytes("ROLE_TWO"))],
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
          role: testRolesMap[keccak256(toUtf8Bytes("ROLE_THREE"))],
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
          role: testRolesMap[keccak256(toUtf8Bytes("ROLE_FOUR"))],
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
    const wrongIFace: Interface = new Interface(["event WrongEvent()"]);
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
          role: testRolesMap[keccak256(toUtf8Bytes("ROLE_SEVEN"))],
          previousAdminRole: testRolesMap[keccak256(toUtf8Bytes("ROLE_EIGHT"))],
          newAdminRole: testRolesMap[keccak256(toUtf8Bytes("ROLE_NINE"))],
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
          role: testRolesMap[keccak256(toUtf8Bytes("ROLE_FIVE"))],
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
          role: testRolesMap[keccak256(toUtf8Bytes("ROLE_SIX"))],
          account: grantedAndRevokedTestCases[5][1],
          sender: grantedAndRevokedTestCases[5][2],
        },
        addresses: [mockNetworkManager.safetyModule],
      }),
    ]);
  });
});
