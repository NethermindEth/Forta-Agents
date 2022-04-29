import { Interface } from "ethers/lib/utils";
import { Finding, FindingType, FindingSeverity, HandleTransaction } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import utils from "./utils";

const TEST_MASTER_APE: string = createAddress("0x9898");
const TEST_MASTER_APE_ADMIN: string = createAddress("0x7171");

const WRONG_IFACE: Interface = new Interface([
  "event WrongEvent(address indexed previousOwner, address indexed newOwner)",
  "function wrongFunction(address _devaddr) public",
]);

const CASES: any[] = [
  [createAddress("0xabab"), createAddress("0x5678")], //OwnershipTransferred
  [createAddress("0xcccc"), createAddress("0x0000")], //OwnershipRenounced
  [createAddress("0xdead"), createAddress("0x2341")], //Farm admin changed
  [createAddress("0xbeef")], //devaddr changed
  [createAddress("0x9452"), createAddress("0xa4b8")], //OwnershipTransferred
  [createAddress("0xcc2c"), createAddress("0x0000")], //OwnershipRenounced
];

const testCreateFinding = (operation: string, contract: string, args: any[]) => {
  switch (operation) {
    case "OwnershipTransferred":
      return Finding.fromObject({
        name: `${contract}: Ownership transferred`,
        description: `${operation} event emitted from ${contract} contract`,
        alertId: "APESWAP-10-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          previousOwner: args[0].toLowerCase(),
          newOwner: args[1].toLowerCase(),
        },
      });
    case "OwnershipRenounced":
      return Finding.fromObject({
        name: `${contract}: Ownership renounced`,
        description: `OwnershipTransferred event emitted from ${contract} contract setting newOwner to Null address`,
        alertId: "APESWAP-10-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          previousOwner: args[0].toLowerCase(),
          newOwner: args[1].toLowerCase(),
        },
      });
    case "TransferredFarmAdmin":
      return Finding.fromObject({
        name: `${contract}: Farm admin changed`,
        description: `${operation} event emitted from ${contract} contract`,
        alertId: "APESWAP-10-3",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          previousFarmAdmin: args[0].toLowerCase(),
          newFarmAdmin: args[1].toLowerCase(),
        },
      });
    default:
      return Finding.fromObject({
        name: "MasterApe: dev address changed",
        description: `${operation} function was called on MasterApe contract`,
        alertId: "APESWAP-10-4",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: {
          newDevAddress: args[0].toLowerCase(),
        },
      });
  }
};

describe("Apeswap role changes bot test suite", () => {
  const handleTransaction: HandleTransaction = provideHandleTransaction(TEST_MASTER_APE, TEST_MASTER_APE_ADMIN);

  it("should ignore other event logs and function calls on MasterApe and MasterApeAdmin contracts", async () => {
    const event = WRONG_IFACE.getEvent("WrongEvent");
    const log = WRONG_IFACE.encodeEventLog(event, [...CASES[0]]);
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x63a4"))
      .addTraces({
        to: TEST_MASTER_APE,
        from: createAddress("0x63a4"),
        input: WRONG_IFACE.encodeFunctionData("wrongFunction", CASES[3]),
      })
      .addAnonymousEventLog(TEST_MASTER_APE, log.data, ...log.topics)
      .addAnonymousEventLog(TEST_MASTER_APE_ADMIN, log.data, ...log.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore events emitted and functions called on another contract", async () => {
    const otherContract = createAddress("0xdade");

    const event1 = utils.EVENTS_IFACE.getEvent("OwnershipTransferred");
    const log1 = utils.EVENTS_IFACE.encodeEventLog(event1, [...CASES[0]]);
    const event2 = utils.EVENTS_IFACE.getEvent("TransferredFarmAdmin");
    const log2 = utils.EVENTS_IFACE.encodeEventLog(event2, [...CASES[2]]);
    const event3 = utils.EVENTS_IFACE.getEvent("OwnershipTransferred"); //Ownership renounced
    const log3 = utils.EVENTS_IFACE.encodeEventLog(event3, [...CASES[1]]);

    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xbba4"))
      .addTraces({
        to: otherContract,
        from: createAddress("0xbba4"),
        input: utils.FUNCTIONS_IFACE.encodeFunctionData("dev", CASES[3]),
      })
      .addAnonymousEventLog(otherContract, log1.data, ...log1.topics)
      .addAnonymousEventLog(otherContract, log2.data, ...log2.topics)
      .addAnonymousEventLog(otherContract, log3.data, ...log3.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return findings when role changes happen on MasterApe and MasterApeAdmin contracts", async () => {
    const event1 = utils.EVENTS_IFACE.getEvent("OwnershipTransferred");
    const log1 = utils.EVENTS_IFACE.encodeEventLog(event1, [...CASES[0]]);
    const log3 = utils.EVENTS_IFACE.encodeEventLog(event1, [...CASES[1]]);
    const log4 = utils.EVENTS_IFACE.encodeEventLog(event1, [...CASES[4]]);
    const log5 = utils.EVENTS_IFACE.encodeEventLog(event1, [...CASES[5]]);

    const event2 = utils.EVENTS_IFACE.getEvent("TransferredFarmAdmin");
    const log2 = utils.EVENTS_IFACE.encodeEventLog(event2, [...CASES[2]]);

    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0xbba4"))
      .addTraces({
        to: TEST_MASTER_APE,
        from: createAddress("0xbba4"),
        input: utils.FUNCTIONS_IFACE.encodeFunctionData("dev", CASES[3]),
      })
      .addAnonymousEventLog(TEST_MASTER_APE, log1.data, ...log1.topics)
      .addAnonymousEventLog(TEST_MASTER_APE, log3.data, ...log3.topics)
      .addAnonymousEventLog(TEST_MASTER_APE_ADMIN, log2.data, ...log2.topics)
      .addAnonymousEventLog(TEST_MASTER_APE_ADMIN, log4.data, ...log4.topics)
      .addAnonymousEventLog(TEST_MASTER_APE_ADMIN, log5.data, ...log5.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding("OwnershipTransferred", "MasterApe", CASES[0]),
      testCreateFinding("OwnershipRenounced", "MasterApe", CASES[1]),
      testCreateFinding("TransferredFarmAdmin", "MasterApeAdmin", CASES[2]),
      testCreateFinding("OwnershipTransferred", "MasterApeAdmin", CASES[4]),
      testCreateFinding("OwnershipRenounced", "MasterApeAdmin", CASES[5]),
      testCreateFinding("dev", "MasterApe", CASES[3]),
    ]);
  });
});
