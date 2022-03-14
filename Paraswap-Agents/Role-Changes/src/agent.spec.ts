import { formatBytes32String, Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { EVENTS_ABI } from "./utils";

const CONTRACT = createAddress("0x1");
const EVENTS_IFACE = new Interface(EVENTS_ABI);
const IRRELEVANT_EVENT_IFACE = new Interface([
  "event IrrelevantEvent(bytes32 indexed role, address indexed account, address indexed sender)",
]);

const createFinding = (logName: string, args: string[]): Finding => {
  let metadata;

  if (logName == "RoleAdminChanged") {
    metadata = {
      role: args[1],
      previousAdminRole: args[2],
      newAdminRole: args[3],
    };
  } else {
    metadata = {
      role: args[1],
      account: args[2].slice(0, 2) + args[2].slice(26),
      sender: args[3].slice(0, 2) + args[3].slice(26),
    };
  }
  return Finding.fromObject({
    name: `Role Change detected on AccessControl contract`,
    description: `${logName} event emitted`,
    alertId: "PARASWAP-2",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Paraswap",
    metadata,
  });
};

describe("Large deposit/ withdrawal agent tests suite", () => {
  // init the agent
  let handler: HandleTransaction;
  handler = provideHandleTransaction(CONTRACT);

  it("should ignore transactions without events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should ignore events emitted on a different contract", async () => {
    const differentContract = createAddress("0xd4");
    // events generation
    const log1 = EVENTS_IFACE.encodeEventLog(EVENTS_IFACE.getEvent("RoleAdminChanged"), [
      formatBytes32String("abc"), // role
      formatBytes32String("acd"), // previousAdminRole
      formatBytes32String("ade"), // newAdminRole
    ]);
    const log2 = EVENTS_IFACE.encodeEventLog(EVENTS_IFACE.getEvent("RoleGranted"), [
      formatBytes32String("bbc"), // role
      createAddress("0xa1"), // account
      createAddress("0xa2"), // sender
    ]);
    const log3 = EVENTS_IFACE.encodeEventLog(EVENTS_IFACE.getEvent("RoleRevoked"), [
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
      formatBytes32String("bbc"), // role
      createAddress("0xa1"), // account
      createAddress("0xa2"), // sender
    ]);
    // create a transaction with the previous event logs
    const tx: TransactionEvent = new TestTransactionEvent().addAnonymousEventLog(CONTRACT, log.data, ...log.topics);
    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([]);
  });

  it("should return single finding", async () => {
    // events generation
    const log1 = EVENTS_IFACE.encodeEventLog(EVENTS_IFACE.getEvent("RoleAdminChanged"), [
      formatBytes32String("abc"), // role
      formatBytes32String("acd"), // previousAdminRole
      formatBytes32String("ade"), // newAdminRole
    ]);
    // create a transaction with the previous event logs
    const tx: TransactionEvent = new TestTransactionEvent().addAnonymousEventLog(CONTRACT, log1.data, ...log1.topics);
    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([createFinding("RoleAdminChanged", log1.topics)]);
  });

  it("should return multiple findings", async () => {
    // events generation
    const log1 = EVENTS_IFACE.encodeEventLog(EVENTS_IFACE.getEvent("RoleAdminChanged"), [
      formatBytes32String("abc"), // role
      formatBytes32String("acd"), // previousAdminRole
      formatBytes32String("ade"), // newAdminRole
    ]);

    const log2 = EVENTS_IFACE.encodeEventLog(EVENTS_IFACE.getEvent("RoleGranted"), [
      formatBytes32String("bbc"), // role
      createAddress("0x1"), // account
      createAddress("0x2"), // sender
    ]);

    const log3 = EVENTS_IFACE.encodeEventLog(EVENTS_IFACE.getEvent("RoleRevoked"), [
      formatBytes32String("cbc"), // role
      createAddress("0x3"), // account
      createAddress("0x4"), // sender
    ]);

    // create a transaction with the previous event logs
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(CONTRACT, log1.data, ...log1.topics)
      .addAnonymousEventLog(CONTRACT, log2.data, ...log2.topics)
      .addAnonymousEventLog(CONTRACT, log3.data, ...log3.topics);

    const findings: Finding[] = await handler(tx);

    expect(findings).toStrictEqual([
      createFinding("RoleAdminChanged", log1.topics),
      createFinding("RoleGranted", log2.topics),
      createFinding("RoleRevoked", log3.topics),
    ]);
  });
});
