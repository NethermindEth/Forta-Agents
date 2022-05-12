import { Interface, EventFragment } from "ethers/lib/utils";
import {
  Finding,
  FindingType,
  FindingSeverity,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import {
  createAddress,
  TestTransactionEvent,
} from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { BigNumber } from "ethers";
import { EVENTS_IFACE } from "./utils";
import NetworkManager from "./network";

const TEST_CONTRACTS = {
  banana: createAddress("0xabcd"),
  gnana: createAddress("0xdcba"),
};

const WRONG_IFACE: Interface = new Interface([
  "event WrongEvent(address indexed previousOwner, address indexed newOwner)",
]);

const CASES: any[] = [
  [createAddress("0xabab"), createAddress("0x5678")], //OwnershipTransferred
  [createAddress("0xcccc"), createAddress("0x0000")], //OwnershipRenounced
  [createAddress("0xdead"), createAddress("0x2341"), BigNumber.from(34232)], //MPC Owner changed
  [createAddress("0x9452"), createAddress("0xa4b8")], //OwnershipTransferred
  [createAddress("0xcc2c"), createAddress("0x0000")], //OwnershipRenounced
  [createAddress("0x9152"), createAddress("0xa4b2")], //OwnershipTransferred
  [createAddress("0xab2c"), createAddress("0x0000")], //OwnershipRenounced
  [createAddress("0xbbcb"), createAddress("0x8841"), BigNumber.from(134232)], //MPC Owner changed
];

const testCreateFinding = (
  token: string,
  event: string,
  args: any[]
): Finding => {
  let metadata;
  if (event === "LogChangeMPCOwner") {
    metadata = {
      oldOwner: args[0].toLowerCase(),
      newOwner: args[1].toLowerCase(),
    };
  } else {
    metadata = {
      previousOwner: args[0].toLowerCase(),
      newOwner: args[1].toLowerCase(),
    };
  }
  switch (args[1] == "0x0000000000000000000000000000000000000000") {
    case true:
      return Finding.fromObject({
        name: `${token}: Ownership renounced`,
        description: `${event} event emitted from ${token} contract setting newOwner to Null address`,
        alertId: "APESWAP-6-1",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: metadata,
      });
    default:
      return Finding.fromObject({
        name: `${token}: Ownership transferred`,
        description: `${event} event emitted from ${token} contract`,
        alertId: "APESWAP-6-2",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "Apeswap",
        metadata: metadata,
      });
  }
};

describe("Apeswap tokens' ownership changes monitoring bot test suite", () => {
  const mockNetworkManager: NetworkManager = {
    banana: TEST_CONTRACTS.banana,
    gnana: TEST_CONTRACTS.gnana,
    networkId: 0,
    networkMap: {} as any,
    setNetwork: jest.fn(),
  };

  const handleTransaction: HandleTransaction =
    provideHandleTransaction(mockNetworkManager);

  it("should return 0 findings in empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other events emitted from BANANA/GNANA token contracts", async () => {
    const event0: EventFragment = WRONG_IFACE.getEvent("WrongEvent");
    const log0 = WRONG_IFACE.encodeEventLog(event0, [...CASES[0]]);
    const log1 = WRONG_IFACE.encodeEventLog(event0, [...CASES[1]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        mockNetworkManager.banana,
        log0.data,
        ...log0.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.banana,
        log1.data,
        ...log1.topics
      );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore Ownership transfers events on other contracts ", async () => {
    const event0: EventFragment = EVENTS_IFACE.getEvent("OwnershipTransferred");
    const log0 = EVENTS_IFACE.encodeEventLog(event0, [...CASES[0]]);
    const event1: EventFragment = EVENTS_IFACE.getEvent("OwnershipTransferred");
    const log1 = EVENTS_IFACE.encodeEventLog(event1, [...CASES[1]]);
    const event2: EventFragment = EVENTS_IFACE.getEvent("LogChangeMPCOwner");
    const log2 = EVENTS_IFACE.encodeEventLog(event2, [...CASES[2]]);

    const wrongContract: string = createAddress("0xdead");

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(wrongContract, log0.data, ...log0.topics)
      .addAnonymousEventLog(wrongContract, log1.data, ...log1.topics)
      .addAnonymousEventLog(wrongContract, log2.data, ...log2.topics);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect multiple ownership change events from BANANA/GNANA token contracts", async () => {
    const event0: EventFragment = EVENTS_IFACE.getEvent("OwnershipTransferred");
    const log0 = EVENTS_IFACE.encodeEventLog(event0, [...CASES[3]]);
    const log1 = EVENTS_IFACE.encodeEventLog(event0, [...CASES[4]]);
    const log4 = EVENTS_IFACE.encodeEventLog(event0, [...CASES[5]]);
    const log5 = EVENTS_IFACE.encodeEventLog(event0, [...CASES[6]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        mockNetworkManager.banana,
        log0.data,
        ...log0.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.banana,
        log1.data,
        ...log1.topics
      )
      .addAnonymousEventLog(mockNetworkManager.gnana, log4.data, ...log4.topics)
      .addAnonymousEventLog(
        mockNetworkManager.gnana,
        log5.data,
        ...log5.topics
      );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding("BANANA", "OwnershipTransferred", CASES[3]),
      testCreateFinding("BANANA", "OwnershipTransferred", CASES[4]),
      testCreateFinding("GNANA", "OwnershipTransferred", CASES[5]),
      testCreateFinding("GNANA", "OwnershipTransferred", CASES[6]),
    ]);
  });

  it("should detect multiple MPC Ownership changes on BANANA token on Polygon", async () => {
    mockNetworkManager.networkId = 137;
    const event: EventFragment = EVENTS_IFACE.getEvent("LogChangeMPCOwner");
    const log0 = EVENTS_IFACE.encodeEventLog(event, [...CASES[2]]);
    const log1 = EVENTS_IFACE.encodeEventLog(event, [...CASES[7]]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(
        mockNetworkManager.banana,
        log0.data,
        ...log0.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.banana,
        log1.data,
        ...log1.topics
      );

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding("BANANA", "LogChangeMPCOwner", CASES[2]),
      testCreateFinding("BANANA", "LogChangeMPCOwner", CASES[7]),
    ]);
  });
});
