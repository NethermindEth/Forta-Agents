import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { Interface } from "ethers/lib/utils";
import { provideHandleTransaction } from "./agent";
import NetworkManager from "./network";
import { MONITORED_CONTRACT_IFACE } from "./utils";

const testSender: string = createAddress("0xad");

// Format: [previousOnwer, newOwner]
const testOwners: string[][] = [
  [createAddress("0xab12"), createAddress("0xab34")],
  [createAddress("0xac56"), createAddress("0xac78")],
  [createAddress("0xad91"), createAddress("0xad23")],
];

const createFinding = (previousOnwer: string, newOwner: string, emittingAddress: string) => {
  return Finding.fromObject({
    name: "Ownership of a TraderJoe contract has changed",
    description: "OwnershipTransferred event was emitted",
    alertId: "TRADERJOE-24",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "TraderJoe",
    metadata: {
      previousOwner: previousOnwer.toLowerCase(),
      newOwner: newOwner.toLowerCase(),
    },
    addresses: [emittingAddress],
  });
};

describe("Ownership Changes Monitor Test Suite", () => {
  let handleTransaction: HandleTransaction;

  const mockNetworkManager: NetworkManager = {
    monitoredContracts: [createAddress("0xaa123"), createAddress("0xaa456")],
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

  it("should detect a OwnershipTransferred event emission from multiple monitored contracts", async () => {
    const [previousOwnerOne, newOwnerOne] = testOwners[0];
    const [previousOwnerTwo, newOwnerTwo] = testOwners[1];

    const OwnershipTransferredLogOne = MONITORED_CONTRACT_IFACE.encodeEventLog(
      MONITORED_CONTRACT_IFACE.getEvent("OwnershipTransferred"),
      [previousOwnerOne, newOwnerOne]
    );
    const OwnershipTransferredLogTwo = MONITORED_CONTRACT_IFACE.encodeEventLog(
      MONITORED_CONTRACT_IFACE.getEvent("OwnershipTransferred"),
      [previousOwnerTwo, newOwnerTwo]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.monitoredContracts[0])
      .setFrom(testSender)
      .addAnonymousEventLog(
        mockNetworkManager.monitoredContracts[0],
        OwnershipTransferredLogOne.data,
        ...OwnershipTransferredLogOne.topics
      )
      .addAnonymousEventLog(
        mockNetworkManager.monitoredContracts[1],
        OwnershipTransferredLogTwo.data,
        ...OwnershipTransferredLogTwo.topics
      );

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      createFinding(previousOwnerOne, newOwnerOne, mockNetworkManager.monitoredContracts[0]),
      createFinding(previousOwnerTwo, newOwnerTwo, mockNetworkManager.monitoredContracts[1]),
    ]);
  });

  it("should not detect the event emitting from the incorrect contract", async () => {
    const wrongContract: string = createAddress("0xd34d");
    const [previousOwner, newOwner] = testOwners[1];

    const OwnershipTransferredLog = MONITORED_CONTRACT_IFACE.encodeEventLog(
      MONITORED_CONTRACT_IFACE.getEvent("OwnershipTransferred"),
      [previousOwner, newOwner]
    );

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(wrongContract)
      .setFrom(testSender)
      .addAnonymousEventLog(wrongContract, OwnershipTransferredLog.data, ...OwnershipTransferredLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should not detect another event emission from a monitored contract", async () => {
    const wrongIFace: Interface = new Interface(["event WrongEvent()"]);
    const wrongLog = wrongIFace.encodeEventLog(wrongIFace.getEvent("WrongEvent"), []);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.monitoredContracts[0])
      .setFrom(testSender)
      .addAnonymousEventLog(mockNetworkManager.monitoredContracts[0], wrongLog.data, ...wrongLog.topics)
      .addAnonymousEventLog(mockNetworkManager.monitoredContracts[1], wrongLog.data, ...wrongLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
