import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import abi from "./abi";
import { provideHandleTransaction } from "./agent";

const PAIRS: string[] = [
  createAddress("0xace17e"),
  createAddress("0xca1d0"),
  createAddress("0xf11e7e"),
  createAddress("0xc0c1do"),
  createAddress("0xe570fad0"),
];

const tradeFeesFinding = (pair: string, oldFee: string, newFee: string): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair Updated",
    description: "Trade fee updated",
    protocol: "Impossible Finance",
    alertId: "impossible-6-1",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: { pair, oldFee, newFee },
  });

const withdrawalFeeRatioFinding = (pair: string, oldFee: string, newFee: string): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair Updated",
    description: "Withdrawal fee ratio updated",
    protocol: "Impossible Finance",
    alertId: "impossible-6-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: { pair, oldFee, newFee },
  });

describe("Swap Fee Monitor agent tests suite", () => {
  const factory: string = createAddress("0xf00d");
  let handler: HandleTransaction;
  
  beforeEach(() => {
    handler = provideHandleTransaction(new Set(PAIRS), factory);
  });

  it("should report empty findings in txns without events", async () => {
    const tx: TransactionEvent =  new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect UpdatedTradeFees events in the initialization pairs", async () => {
    const { data, topics } = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedTradeFees"), [20, 50]
    )
    const tx: TransactionEvent =  new TestTransactionEvent()
      .addAnonymousEventLog(PAIRS[0], data, ...topics)
      .addAnonymousEventLog(PAIRS[3], data, ...topics)
      .addAnonymousEventLog(PAIRS[2], data, ...topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      tradeFeesFinding(PAIRS[0], "20", "50"),
      tradeFeesFinding(PAIRS[3], "20", "50"),
      tradeFeesFinding(PAIRS[2], "20", "50"),
    ]);
  });

  it("should detect UpdatedWithdrawalFeeRatio events in the initialization pairs", async () => {
    const { data, topics } = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedWithdrawalFeeRatio"), [1, 2]
    )
    const tx: TransactionEvent =  new TestTransactionEvent()
      .addAnonymousEventLog(PAIRS[4], data, ...topics)
      .addAnonymousEventLog(PAIRS[1], data, ...topics)
      .addAnonymousEventLog(PAIRS[0], data, ...topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      withdrawalFeeRatioFinding(PAIRS[4], "1", "2"),
      withdrawalFeeRatioFinding(PAIRS[1], "1", "2"),
      withdrawalFeeRatioFinding(PAIRS[0], "1", "2"),
    ]);
  });

  it("should detect events in newly created pairs", async () => {
    const newPair: string = createAddress("0xfabada");
    const log0 = abi.FACTORY.encodeEventLog(
      abi.FACTORY.getEvent("PairCreated"), [
        createAddress("0x1"), // ignored
        createAddress("0x2"), // ignored
        createAddress("0xfabada"),
        3, // ignored
      ]
    );
    const log1 = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedWithdrawalFeeRatio"), [5, 12]
    );
    const log2 = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedTradeFees"), [15, 42]
    );
    const tx: TransactionEvent =  new TestTransactionEvent()
      .addAnonymousEventLog(factory, log0.data, ...log0.topics)
      .addAnonymousEventLog(newPair, log1.data, ...log1.topics)
      .addAnonymousEventLog(newPair, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      withdrawalFeeRatioFinding(newPair, "5", "12"),
      tradeFeesFinding(newPair, "15", "42"),
    ]);
  });

  it("should ignore pair creations not emitted in the factory", async () => {
    const newPair: string = createAddress("0xfabada");
    const log0 = abi.FACTORY.encodeEventLog(
      abi.FACTORY.getEvent("PairCreated"), [
        createAddress("0x1"), // ignored
        createAddress("0x2"), // ignored
        createAddress("0xfabada"),
        3, // ignored
      ]
    );
    const log1 = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedWithdrawalFeeRatio"), [5, 12]
    );
    const log2 = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedTradeFees"), [15, 42]
    );
    const tx: TransactionEvent =  new TestTransactionEvent()
      .addAnonymousEventLog(createAddress("0x10af"), log0.data, ...log0.topics)
      .addAnonymousEventLog(newPair, log1.data, ...log1.topics)
      .addAnonymousEventLog(newPair, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore events not emitted in pairs", async () => {
    const log1 = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedWithdrawalFeeRatio"), [3, 3]
    );
    const tx: TransactionEvent =  new TestTransactionEvent()
      .addAnonymousEventLog(createAddress("0x1ce"), log1.data, ...log1.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });
});
