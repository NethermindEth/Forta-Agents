import { FindingType, FindingSeverity, Finding, HandleTransaction, ethers, TransactionEvent } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { BigNumber, utils } from "ethers";
import { provideHandleTransaction } from "./agent";
import NetworkManager from "./network";
import { MODULE_IFACE } from "./utils";

const testSender: string = createAddress("0xab");

// Format: [amount, recipient, newExchangeRate]
const testCases: [BigNumber, string, BigNumber][] = [
  [BigNumber.from("100000000000000000000"), createAddress("0xac01"), BigNumber.from("125000000000000000000")],
  [BigNumber.from("150000000000000000000"), createAddress("0xac02"), BigNumber.from("175000000000000000000")],
  [BigNumber.from("200000000000000000000"), createAddress("0xac03"), BigNumber.from("225000000000000000000")],
];

describe("Parameter Changes Monitor Test Suite", () => {
  let handleTransaction: HandleTransaction;

  const mockNetworkManager: NetworkManager = {
    safetyModule: createAddress("0xab"),
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

  it("should detect a Slashed event emission from both the safety module", async () => {
    const SlashedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Slashed"), [
      testCases[0][0],
      testCases[0][1],
      testCases[0][2],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.safetyModule)
      .setFrom(testSender)
      .addAnonymousEventLog(mockNetworkManager.safetyModule, SlashedLog.data, ...SlashedLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "Slash event has occured on dYdX Security Module.",
        description: "Slashed event was emitted",
        alertId: "DYDX-12",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        protocol: "dYdX",
        metadata: {
          amount: testCases[0][0].toString(),
          recipient: testCases[0][1],
          newExchangeRate: testCases[0][2].toString(),
        },
        addresses: [mockNetworkManager.safetyModule],
      }),
    ]);
  });

  it("should not detect the events emitting from the incorrect contract", async () => {
    const wrongContract: string = createAddress("0xd34d");

    const SlashedLog = MODULE_IFACE.encodeEventLog(MODULE_IFACE.getEvent("Slashed"), [
      testCases[1][0],
      testCases[1][1],
      testCases[1][2],
    ]);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(wrongContract)
      .setFrom(testSender)
      .addAnonymousEventLog(wrongContract, SlashedLog.data, ...SlashedLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should not detect another event emission from either the safety nor liquidity modules", async () => {
    const wrongIFace = new utils.Interface(["event WrongEvent()"]);
    const wrongLog = wrongIFace.encodeEventLog(wrongIFace.getEvent("WrongEvent"), []);

    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(mockNetworkManager.safetyModule)
      .setFrom(testSender)
      .addAnonymousEventLog(mockNetworkManager.safetyModule, wrongLog.data, ...wrongLog.topics);

    const findings = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });
});
