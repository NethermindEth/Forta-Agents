import {
  EntityType,
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  Label,
} from "forta-agent";
import {
  TestTransactionEvent,
  MockEthersProvider,
} from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { provideInitialize, provideHandleTransaction, BOT_ID } from "./agent";
import { when } from "jest-when";
import { ScanCountType } from "bot-alert-rate";

const testCreateFinding = (
  txHash: string,
  from: string,
  to: string,
  funcSig: string,
  anomalyScore: number,
  severity: FindingSeverity
): Finding => {
  const [alertId, confidence, wording] =
    severity === FindingSeverity.Medium
      ? ["NIP-1", 0.9, "funds"]
      : ["NIP-2", 0.6, "transaction"];

  return Finding.fromObject({
    name: "Possible native ice phishing with social engineering component attack",
    description: `${from} sent ${wording} to ${to} with ${funcSig} as input data`,
    alertId,
    severity,
    type: FindingType.Suspicious,
    metadata: {
      attacker: to,
      victim: from,
      funcSig,
      anomalyScore: anomalyScore.toString(),
    },
    labels: [
      Label.fromObject({
        entity: txHash,
        entityType: EntityType.Transaction,
        label: "Attack",
        confidence,
        remove: false,
      }),
      Label.fromObject({
        entity: from,
        entityType: EntityType.Address,
        label: "Victim",
        confidence,
        remove: false,
      }),
      Label.fromObject({
        entity: to,
        entityType: EntityType.Address,
        label: "Attacker",
        confidence,
        remove: false,
      }),
    ],
  });
};
const mockFetcher = {
  isEoa: jest.fn(),
  getSignature: jest.fn(),
};

const mockCalculateRate = jest.fn();

describe("Native Ice Phishing Bot test suite", () => {
  let initialize;
  let handleTransaction: HandleTransaction;
  const mockProvider = new MockEthersProvider();

  beforeEach(async () => {
    initialize = provideInitialize(mockProvider as any);
    mockProvider.setNetwork(1);
    await initialize();
    handleTransaction = provideHandleTransaction(
      mockFetcher as any,
      mockCalculateRate
    );
  });

  it("Should return empty findings if the input data is not a function signature", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setTo(createAddress("0x01"))
      .setValue("0x0bb")
      .setData("0x00");
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("Should return empty findings if the call is to a contract", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setTo(createAddress("0x01"))
      .setValue("0x0bb")
      .setData("0x12345678");

    when(mockFetcher.isEoa)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(false);
    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([]);
  });

  it("Should return a Medium severity finding if the call is to an EOA, the value is non-zero and there's input data that's a function signature", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(createAddress("0x01"))
      .setValue("0x0bb")
      .setData("0x12345678")
      .setHash("0xabcd");

    when(mockFetcher.isEoa)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(true);

    when(mockFetcher.getSignature)
      .calledWith("0x12345678")
      .mockReturnValue("transfer(address,uint256)");

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-1", ScanCountType.TxWithInputDataCount)
      .mockReturnValue(0.0034234);

    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateFinding(
        "0xabcd",
        createAddress("0x0f"),
        createAddress("0x01"),
        "transfer(address,uint256)",
        0.0034234,
        FindingSeverity.Medium
      ),
    ]);
  });

  it("Should return an Info severity finding if the call is to an EOA, the value is zero and there's input data that's a function signature", async () => {
    const tx: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(createAddress("0x0f"))
      .setTo(createAddress("0x01"))
      .setValue("0x0")
      .setData("0x12345678")
      .setHash("0xabcd");

    when(mockFetcher.isEoa)
      .calledWith(createAddress("0x01"))
      .mockReturnValue(true);

    when(mockFetcher.getSignature)
      .calledWith("0x12345678")
      .mockReturnValue("transfer(address,uint256)");

    when(mockCalculateRate)
      .calledWith(1, BOT_ID, "NIP-2", ScanCountType.TxWithInputDataCount)
      .mockReturnValue(0.0234234);

    const findings: Finding[] = await handleTransaction(tx);
    expect(findings).toStrictEqual([
      testCreateFinding(
        "0xabcd",
        createAddress("0x0f"),
        createAddress("0x01"),
        "transfer(address,uint256)",
        0.0234234,
        FindingSeverity.Info
      ),
    ]);
  });
});
