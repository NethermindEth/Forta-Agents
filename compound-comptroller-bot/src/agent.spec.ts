import { Interface } from "ethers/lib/utils";
import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
  ethers,
  Network,
} from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { TestTransactionEvent } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools/lib";
import { provideHandleTransaction } from "./agent";
import { AgentConfig, NetworkData, PAUSE_EVENTS_ABIS } from "./utils";

const COMPOUND_COMPTROLLER_ADDRESS = createAddress("0xcc01");

const DEFAULT_CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    compoundComptrollerAddress: COMPOUND_COMPTROLLER_ADDRESS,
  },
};

const createFinding = (signature: string, args: any[]): Finding => {
  switch (signature) {
    case "ActionPaused(address,string,bool)":
      return Finding.from({
        name: "An action is paused on a market",
        description: `${args[1]} is paused on ${args[0]}`,
        alertId: "NETH-COMP-PAUSE-EVENT-1",
        protocol: "Compound",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        metadata: {
          CToken: args[0],
          action: args[1],
          pauseState: args[2].toString(),
        },
      });
    case "ActionPaused(string,bool)":
      return Finding.from({
        name: "A global action is paused",
        description: `${args[0]} is globally paused`,
        alertId: "NETH-COMP-PAUSE-EVENT-2",
        protocol: "Compound",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        metadata: {
          action: args[0],
          pauseState: args[1].toString(),
        },
      });
    default:
      return Finding.from({
        name: "Pause guardian is changed",
        description: "Pause guardian is changed on the Comptroller contract",
        alertId: "NETH-COMP-PAUSE-EVENT-3",
        protocol: "Compound",
        type: FindingType.Info,
        severity: FindingSeverity.Info,
        metadata: {
          oldPauseGuardian: args[0],
          newPauseGuardian: args[1],
        },
      });
  }
};

describe("Compound Comptroller test suite", () => {
  let handleTransaction: HandleTransaction;
  let networkManager: NetworkManager<NetworkData>;

  const COMPTROLLER_IFACE = new Interface(PAUSE_EVENTS_ABIS);
  const IRRELEVANT_IFACE = new Interface(["event DifferentEvent()"]);

  const TEST_DATA = [
    [createAddress("0xd0"), createAddress("0xa0")], // NewPauseGuardian event
    [createAddress("0xd1"), createAddress("0xa1")], // NewPauseGuardian event
    [createAddress("0xd2"), createAddress("0xa2")], // NewPauseGuardian event
    ["Transfer", true], // ActionPaused(string, bool) event
    ["Mint", true], // ActionPaused(string, bool) event
    ["Borrow", true], // ActionPaused(string, bool) event
    [createAddress("0xcc0"), "Mint", true], // ActionPaused(string, bool) event
    [createAddress("0xcc0"), "Borrow", true], // ActionPaused(string, bool) event
    [createAddress("0xcc0"), "Transfer", true], // ActionPaused(string, bool) event
  ];

  beforeAll(() => {
    networkManager = new NetworkManager(DEFAULT_CONFIG, Network.MAINNET);
    handleTransaction = provideHandleTransaction(networkManager);
  });

  it("should ignore empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore events on other contracts", async () => {
    const transactionEvent = new TestTransactionEvent().addEventLog(
      COMPTROLLER_IFACE.getEvent("NewPauseGuardian"),
      createAddress("0xdf01"),
      TEST_DATA[0]
    );

    const findings = await handleTransaction(transactionEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other events on the comptroller contract", async () => {
    const transactionEvent = new TestTransactionEvent().addEventLog(
      IRRELEVANT_IFACE.getEvent("DifferentEvent"),
      COMPOUND_COMPTROLLER_ADDRESS
    );

    const findings = await handleTransaction(transactionEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should detect new pause guardian change", async () => {
    const transactionEvent = new TestTransactionEvent().addEventLog(
      COMPTROLLER_IFACE.getEvent("NewPauseGuardian"),
      COMPOUND_COMPTROLLER_ADDRESS,
      TEST_DATA[0]
    );

    const findings = await handleTransaction(transactionEvent);
    expect(findings).toStrictEqual([createFinding("NewPauseGarden(address,address)", TEST_DATA[0])]);
  });

  it("should detect a global action pause", async () => {
    const transactionEvent = new TestTransactionEvent().addEventLog(
      COMPTROLLER_IFACE.getEvent("ActionPaused(string,bool)"),
      COMPOUND_COMPTROLLER_ADDRESS,
      TEST_DATA[3]
    );

    const findings = await handleTransaction(transactionEvent);
    expect(findings).toStrictEqual([createFinding("ActionPaused(string,bool)", TEST_DATA[3])]);
  });

  it("should detect an action pause on a market", async () => {
    const transactionEvent = new TestTransactionEvent().addEventLog(
      COMPTROLLER_IFACE.getEvent("ActionPaused(address,string,bool)"),
      COMPOUND_COMPTROLLER_ADDRESS,
      TEST_DATA[6]
    );

    const findings = await handleTransaction(transactionEvent);
    expect(findings).toStrictEqual([createFinding("ActionPaused(address,string,bool)", TEST_DATA[6])]);
  });

  it("should detect multiple event emissions and ignore irrelevant events", async () => {
    const transactionEvent = new TestTransactionEvent()
      .addEventLog(
        COMPTROLLER_IFACE.getEvent("ActionPaused(address,string,bool)"),
        COMPOUND_COMPTROLLER_ADDRESS,
        TEST_DATA[7]
      )
      .addEventLog(IRRELEVANT_IFACE.getEvent("DifferentEvent"), COMPOUND_COMPTROLLER_ADDRESS)
      .addEventLog(COMPTROLLER_IFACE.getEvent("ActionPaused(string,bool)"), COMPOUND_COMPTROLLER_ADDRESS, TEST_DATA[4]);

    const findings = await handleTransaction(transactionEvent);
    expect(findings).toStrictEqual([
      createFinding("ActionPaused(address,string,bool)", TEST_DATA[7]),
      createFinding("ActionPaused(string,bool)", TEST_DATA[4]),
    ]);
  });
});
