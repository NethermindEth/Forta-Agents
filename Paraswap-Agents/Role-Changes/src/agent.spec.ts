import { formatBytes32String, Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { EVENTS_ABI } from "./utils";

const TEST_SWAPPER = createAddress("0x1");
const TEST_ACCESS_IFACE = new Interface(EVENTS_ABI);
const IRRELEVANT_EVENT_IFACE = new Interface([
  "event IrrelevantEvent(bytes32 indexed role, address indexed account, address indexed sender)",
]);

console.log(formatBytes32String("ROUTER_ROLE"));

const createFinding = (logName: string, args: string[]) => {
  if (logName == "RoleAdminChanged") {
    return Finding.fromObject({
      name: "Admin role change detected on AugustusSwapper contract",
      description: `${logName} event emitted`,
      alertId: "PARASWAP-2-1",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Paraswap",
      metadata: {
        role: args[1],
        previousAdminRole: args[2],
        newAdminRole: args[3],
      },
    });
  } else if (logName == "RoleGranted") {
    return Finding.fromObject({
      name: "Role grant detected on AugustusSwapper contract",
      description: `${logName} event emitted`,
      alertId: "PARASWAP-2-2",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Paraswap",
      metadata: {
        role: args[1],
        account: args[2].slice(0, 2) + args[2].slice(26),
        sender: args[3].slice(0, 2) + args[3].slice(26),
      },
    });
  } else {
    return Finding.fromObject({
      name: "Role revoke detected on AugustusSwapper contract",
      description: `${logName} event emitted`,
      alertId: "PARASWAP-2-3",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      protocol: "Paraswap",
      metadata: {
        role: args[1],
        account: args[2].slice(0, 2) + args[2].slice(26),
        sender: args[3].slice(0, 2) + args[3].slice(26),
      },
    });
  }
};

describe("Paraswap Role Change Agent Test Suite", () => {
  // init the agent
  let handler: HandleTransaction;
  handler = provideHandleTransaction(TEST_SWAPPER);

  it("should ignore transactions without events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should ignore events emitted on a different contract", async () => {
    const differentContract = createAddress("0xd4");
    // events generation
    const log1 = TEST_ACCESS_IFACE.encodeEventLog(TEST_ACCESS_IFACE.getEvent("RoleAdminChanged"), [
      formatBytes32String("abc"), // role
      formatBytes32String("acd"), // previousAdminRole
      formatBytes32String("ade"), // newAdminRole
    ]);
    const log2 = TEST_ACCESS_IFACE.encodeEventLog(TEST_ACCESS_IFACE.getEvent("RoleGranted"), [
      formatBytes32String("bbc"), // role
      createAddress("0xa1"), // account
      createAddress("0xa2"), // sender
    ]);
    const log3 = TEST_ACCESS_IFACE.encodeEventLog(TEST_ACCESS_IFACE.getEvent("RoleRevoked"), [
      formatBytes32String("cbc"), // role
      createAddress("0xb1"), // account
      createAddress("0xb2"), // sender
    ]);
    // create a transaction with the previous event logs
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(differentContract, log1.data, ...log1.topics)
      .addAnonymousEventLog(differentContract, log2.data, ...log2.topics)
      .addAnonymousEventLog(differentContract, log3.data, ...log3.topics);

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should ignore different events on the same contract", async () => {
    // events generation
    const log = IRRELEVANT_EVENT_IFACE.encodeEventLog(IRRELEVANT_EVENT_IFACE.getEvent("IrrelevantEvent"), [
      formatBytes32String("dbc"), // role
      createAddress("0xa3"), // account
      createAddress("0xa4"), // sender
    ]);
    // create a transaction with the previous event logs
    const tx: TransactionEvent = new TestTransactionEvent().addAnonymousEventLog(TEST_SWAPPER, log.data, ...log.topics);
    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should return single finding", async () => {
    // events generation
    const log1 = TEST_ACCESS_IFACE.encodeEventLog(TEST_ACCESS_IFACE.getEvent("RoleAdminChanged"), [
      formatBytes32String("bbc"), // role
      formatBytes32String("bcd"), // previousAdminRole
      formatBytes32String("bde"), // newAdminRole
    ]);
    const log2 = IRRELEVANT_EVENT_IFACE.encodeEventLog(IRRELEVANT_EVENT_IFACE.getEvent("IrrelevantEvent"), [
      formatBytes32String("tse"), // role
      createAddress("0xb5"), // account
      createAddress("0xb6"), // sender
    ]);
    // create a transaction with the previous event logs
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_SWAPPER, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_SWAPPER, log2.data, ...log2.topics);
    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([createFinding("RoleAdminChanged", log1.topics)]);
  });

  it("should return three findings", async () => {
    // events generation
    const log1 = TEST_ACCESS_IFACE.encodeEventLog(TEST_ACCESS_IFACE.getEvent("RoleAdminChanged"), [
      formatBytes32String("cbc"), // role
      formatBytes32String("ccd"), // previousAdminRole
      formatBytes32String("cde"), // newAdminRole
    ]);

    const log2 = TEST_ACCESS_IFACE.encodeEventLog(TEST_ACCESS_IFACE.getEvent("RoleGranted"), [
      formatBytes32String("bbc"), // role
      createAddress("0x1"), // account
      createAddress("0x2"), // sender
    ]);

    const log3 = TEST_ACCESS_IFACE.encodeEventLog(TEST_ACCESS_IFACE.getEvent("RoleRevoked"), [
      formatBytes32String("cbc"), // role
      createAddress("0x3"), // account
      createAddress("0x4"), // sender
    ]);
    const log4 = IRRELEVANT_EVENT_IFACE.encodeEventLog(IRRELEVANT_EVENT_IFACE.getEvent("IrrelevantEvent"), [
      formatBytes32String("ebc"), // role
      createAddress("0xc8"), // account
      createAddress("0xc9"), // sender
    ]);

    // create a transaction with the previous event logs
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(TEST_SWAPPER, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_SWAPPER, log2.data, ...log2.topics)
      .addAnonymousEventLog(TEST_SWAPPER, log3.data, ...log3.topics)
      .addAnonymousEventLog(TEST_SWAPPER, log4.data, ...log4.topics);

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([
      createFinding("RoleAdminChanged", log1.topics),
      createFinding("RoleGranted", log2.topics),
      createFinding("RoleRevoked", log3.topics),
    ]);
  });
});
