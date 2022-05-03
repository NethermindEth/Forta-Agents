import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools";
import { when } from "jest-when";
import abi from "./abi";
import { provideHandleTransaction } from "./agent";

const tradeFeesFinding = (pair: string, oldFee: string, newFee: string): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair fees Updated",
    description: "Trade fee updated",
    protocol: "Impossible Finance",
    alertId: "IMPOSSIBLE-6-1",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: { pair, oldFee, newFee },
  });

const withdrawalFeeRatioFinding = (pair: string, oldFee: string, newFee: string): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair fees Updated",
    description: "Withdrawal fee ratio updated",
    protocol: "Impossible Finance",
    alertId: "IMPOSSIBLE-6-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: { pair, oldFee, newFee },
  });

describe("Swap Fee Monitor agent tests suite", () => {
  const mockFetcher = {
    isImpossiblePair: jest.fn(),
  };
  const handler: HandleTransaction = provideHandleTransaction(mockFetcher as any);

  beforeEach(() => mockFetcher.isImpossiblePair.mockClear());

  it("should report empty findings in txns without events", async () => {
    const tx: TransactionEvent =  new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect UpdatedTradeFees events only in valid Impossible Finance pairs", async () => {
    const PAIRS: string[] = [
      createAddress("0xdef1abc"),
      createAddress("0xdef1"),
      createAddress("0xdef121321"),
    ];
    when(mockFetcher.isImpossiblePair)
      .calledWith(20, PAIRS[0]).mockReturnValue(true)
      .calledWith(20, PAIRS[2]).mockReturnValue(true);

    const { data, topics } = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedTradeFees"), [20, 50]
    )
    const tx: TransactionEvent =  new TestTransactionEvent()
      .setBlock(20)
      .addAnonymousEventLog(PAIRS[1], data, ...topics)
      .addAnonymousEventLog(PAIRS[0], data, ...topics)
      .addAnonymousEventLog(PAIRS[2], data, ...topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      tradeFeesFinding(PAIRS[0], "20", "50"),
      tradeFeesFinding(PAIRS[2], "20", "50"),
    ]);
  });

  it("should detect UpdatedWithdrawalFeeRatio events only in valid Impossible Finance pairs", async () => {
    const PAIRS: string[] = [
      createAddress("0xda0fdc"),
      createAddress("0xda0efb"),
      createAddress("0xda0321"),
    ];
    when(mockFetcher.isImpossiblePair)
      .calledWith(42, PAIRS[2]).mockReturnValue(true)
      .calledWith(42, PAIRS[1]).mockReturnValue(true);

    const { data, topics } = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedWithdrawalFeeRatio"), [1, 2]
    )
    const tx: TransactionEvent =  new TestTransactionEvent()
      .setBlock(42)
      .addAnonymousEventLog(PAIRS[2], data, ...topics)
      .addAnonymousEventLog(PAIRS[1], data, ...topics)
      .addAnonymousEventLog(PAIRS[0], data, ...topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      withdrawalFeeRatioFinding(PAIRS[2], "1", "2"),
      withdrawalFeeRatioFinding(PAIRS[1], "1", "2"),
    ]);
  });

  it("should detect multiple type of events only in valid Impossible Finance pairs", async () => {
    const PAIRS: string[] = [
      createAddress("0xda0fdc"),
      createAddress("0xbade0a"),
      createAddress("0xdead"),
      createAddress("0x1337"),
    ];
    when(mockFetcher.isImpossiblePair)
      .calledWith(2000, PAIRS[0]).mockReturnValue(true)
      .calledWith(2000, PAIRS[3]).mockReturnValue(true);

    const event0 = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedWithdrawalFeeRatio"), [200, 3]
    );
    const event1 = abi.PAIR.encodeEventLog(
      abi.PAIR.getEvent("UpdatedTradeFees"), [4040, 50]
    );
    const tx: TransactionEvent =  new TestTransactionEvent()
      .setBlock(2000)
      .addAnonymousEventLog(PAIRS[2], event1.data, ...event1.topics)
      .addAnonymousEventLog(PAIRS[1], event1.data, ...event1.topics)
      .addAnonymousEventLog(PAIRS[2], event0.data, ...event0.topics)
      .addAnonymousEventLog(PAIRS[3], event1.data, ...event1.topics)
      .addAnonymousEventLog(PAIRS[1], event0.data, ...event0.topics)
      .addAnonymousEventLog(PAIRS[0], event0.data, ...event0.topics)
      .addAnonymousEventLog(PAIRS[0], event1.data, ...event1.topics)
      .addAnonymousEventLog(PAIRS[3], event1.data, ...event1.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      tradeFeesFinding(PAIRS[3], "4040", "50"),
      withdrawalFeeRatioFinding(PAIRS[0], "200", "3"),
      tradeFeesFinding(PAIRS[0], "4040", "50"),
      tradeFeesFinding(PAIRS[3], "4040", "50"),
    ]);
  });
});
