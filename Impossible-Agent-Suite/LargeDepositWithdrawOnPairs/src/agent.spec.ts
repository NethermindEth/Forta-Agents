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

const PAIRS: string[] = [
  createAddress("0xace17e"),
  createAddress("0xca1d0"),
  createAddress("0xf11e7e"),
  createAddress("0xc0c1do"),
  createAddress("0xe570fad0"),
];

const addLiquity = (
  pair: string,
  amount0: string,
  amount1: string,
  sender: string,
  reserve0: string,
  reserve1: string,
): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair Liquidity Action",
    description: "Large liquidity Added",
    alertId: "impossible-9-1",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: { pair, amount0, amount1, sender, reserve0, reserve1 },
  });

const removeLiquity = (
  pair: string,
  amount0: string,
  amount1: string,
  sender: string,
  to: string,
  reserve0: string,
  reserve1: string,
): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair Updated",
    description: "Liquidity Removed",
    alertId: "impossible-9-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: { pair, amount0, amount1, sender, to, reserve0, reserve1 },
  });

describe("Large add/remove Liquidity agent tests suite", () => {
  const factory: string = createAddress("0xf00d");
  const mockReserves = jest.fn();
  const mockFetcher = {
    factory,
    getReserves: mockReserves,
  };
  let handler: HandleTransaction;

  beforeEach(() => {
    handler = provideHandleTransaction(new Set(PAIRS), mockFetcher as any, 20);
  });

  it("should report empty findings in txns without events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect large Mint events in the initialization pairs", async () => {
    const { data, topics } = abi.PAIR.encodeEventLog(abi.PAIR.getEvent("Mint"), [
      createAddress("0xdead"),
      20,
      50,
    ]);
    when(mockReserves)
      .calledWith(21, PAIRS[0]) // Low increasement
      .mockReturnValueOnce({ reserve0: 120, reserve1: 300 });
    when(mockReserves)
      .calledWith(21, PAIRS[2]) // Large token0
      .mockReturnValueOnce({ reserve0: 100, reserve1: 400 });
    when(mockReserves)
      .calledWith(21, PAIRS[3]) // Large token1
      .mockReturnValueOnce({ reserve0: 300, reserve1: 100 });
    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(21)
      .addAnonymousEventLog(PAIRS[0], data, ...topics)
      .addAnonymousEventLog(PAIRS[3], data, ...topics)
      .addAnonymousEventLog(PAIRS[2], data, ...topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      addLiquity(PAIRS[3], "20", "50", createAddress("0xdead"), "300", "100"),
      addLiquity(PAIRS[2], "20", "50", createAddress("0xdead"), "100", "400"),
    ]);
  });

  it("should detect Mint events in the initialization pairs", async () => {
    const { data, topics } = abi.PAIR.encodeEventLog(abi.PAIR.getEvent("Burn"), [
      createAddress("0x4d31"),
      30,
      20,
      createAddress("0xdead"),
    ]);
    when(mockReserves)
      .calledWith(21, PAIRS[0]) // Large token0
      .mockReturnValueOnce({ reserve0: 30, reserve1: 300 });
    when(mockReserves)
      .calledWith(21, PAIRS[2]) // Low increasement
      .mockReturnValueOnce({ reserve0: 200, reserve1: 400 });
    when(mockReserves)
      .calledWith(21, PAIRS[3]) // Large token1
      .mockReturnValueOnce({ reserve0: 1000, reserve1: 100 });
    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(21)
      .addAnonymousEventLog(PAIRS[0], data, ...topics)
      .addAnonymousEventLog(PAIRS[3], data, ...topics)
      .addAnonymousEventLog(PAIRS[2], data, ...topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      removeLiquity(
        PAIRS[0],
        "30",
        "20",
        createAddress("0x4d31"),
        createAddress("0xdead"),
        "30", "300"
      ),
      removeLiquity(
        PAIRS[3],
        "30",
        "20",
        createAddress("0x4d31"),
        createAddress("0xdead"),
        "1000", "100"
      ),
    ]);
  });

  it("should detect events in newly created pairs", async () => {
    const newPair: string = createAddress("0xfabada");
    const log0 = abi.FACTORY.encodeEventLog(abi.FACTORY.getEvent("PairCreated"), [
      createAddress("0x1"), // ignored
      createAddress("0x2"), // ignored
      newPair,
      3, // ignored
    ]);
    const log1 = abi.PAIR.encodeEventLog(abi.PAIR.getEvent("Mint"), [
      createAddress("0xabc"),
      5,
      12,
    ]);
    const log2 = abi.PAIR.encodeEventLog(abi.PAIR.getEvent("Burn"), [
      createAddress("0xdef"),
      15,
      42,
      createAddress("0x123"),
    ]);

    mockReserves
      .mockReturnValueOnce({ reserve0: 20, reserve1: 1 })
      .mockReturnValueOnce({ reserve0: 0, reserve1: 210 });
    const tx: TransactionEvent = new TestTransactionEvent()
      .addAnonymousEventLog(factory, log0.data, ...log0.topics)
      .addAnonymousEventLog(newPair, log1.data, ...log1.topics)
      .addAnonymousEventLog(newPair, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([
      addLiquity(newPair, "5", "12", createAddress("0xabc"), "20", "1"),
      removeLiquity(newPair, "15", "42", createAddress("0xdef"), createAddress("0x123"), "0", "210"),
    ]);
  });

  it("should ignore pair creations not emitted in the factory", async () => {
    const newPair: string = createAddress("0xfabada");
    const log0 = abi.FACTORY.encodeEventLog(abi.FACTORY.getEvent("PairCreated"), [
      createAddress("0x1"), // ignored
      createAddress("0x2"), // ignored
      newPair,
      3, // ignored
    ]);
    const log1 = abi.PAIR.encodeEventLog(abi.PAIR.getEvent("Mint"), [newPair, 5, 12]);
    const log2 = abi.PAIR.encodeEventLog(abi.PAIR.getEvent("Burn"), [
      factory,
      15,
      42,
      PAIRS[0],
    ]);
    const tx: TransactionEvent = new TestTransactionEvent()
      .setBlock(333)
      .addAnonymousEventLog(createAddress("0x10af"), log0.data, ...log0.topics)
      .addAnonymousEventLog(newPair, log1.data, ...log1.topics)
      .addAnonymousEventLog(newPair, log2.data, ...log2.topics);

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore events not emitted in pairs", async () => {
    const log1 = abi.PAIR.encodeEventLog(abi.PAIR.getEvent("Mint"), [
      createAddress("0x0"),
      3,
      3,
    ]);
    const tx: TransactionEvent = new TestTransactionEvent().addAnonymousEventLog(
      createAddress("0x1ce"),
      log1.data,
      ...log1.topics
    );

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });
});
