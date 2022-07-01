import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { FindingType, FindingSeverity, Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import { createAddress, MockEthersProvider, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import abi from "./abi";
import { provideHandleTransaction } from "./agent";
import PairFetcher from "./pairs.fetcher";

type TestData = [string, string, string, string, string, string[], string, string, boolean, number][];

// address, token0, token1, realPair, event, params, reserves0, reserve1, emit finding, block
const CASES: TestData = [
  // not pairs
  [
    createAddress("0xace17e"),
    createAddress("0xa1"),
    createAddress("0xa2"),
    createAddress("0xfefe"),
    "Mint",
    [createAddress("0x1a"), "1000", "2000"],
    "1000",
    "2000",
    false,
    1,
  ],
  [
    createAddress("0xca1d0"),
    createAddress("0xa3"),
    createAddress("0xa4"),
    createAddress("0xfefe"),
    "Burn",
    [createAddress("0x1b"), "2000", "3000", createAddress("0x2b")],
    "100",
    "200",
    false,
    2,
  ],
  // under threshold
  [
    createAddress("0xf11e7e"),
    createAddress("0xa23"),
    createAddress("0xa32"),
    createAddress("0xf11e7e"),
    "Mint",
    [createAddress("0x1c"), "1", "1"],
    "200",
    "200",
    false,
    3,
  ],
  [
    createAddress("0xc0c1d0"),
    createAddress("0xa5"),
    createAddress("0xa6"),
    createAddress("0xc0c1d0"),
    "Burn",
    [createAddress("0x1b"), "10", "3", createAddress("0x2b")],
    "4000",
    "200",
    false,
    4,
  ],
  // over threshold
  [
    createAddress("0xe570fad0"),
    createAddress("0xa85"),
    createAddress("0xa86"),
    createAddress("0xe570fad0"),
    "Mint",
    [createAddress("0x1e"), "100", "200"],
    "10",
    "20",
    true,
    5,
  ],
  [
    createAddress("0xfee"),
    createAddress("0xa95"),
    createAddress("0xa96"),
    createAddress("0xfee"),
    "Burn",
    [createAddress("0x1f"), "200", "40", createAddress("0x2f")],
    "1000",
    "200",
    true,
    6,
  ],
  // other events on pairs
  [
    createAddress("0x1ce"),
    createAddress("0xa75"),
    createAddress("0xa76"),
    createAddress("0x1ce"),
    "Test",
    ["1", "2"],
    "10",
    "20",
    false,
    7,
  ],
  [
    createAddress("0xf00d"),
    createAddress("0xa65"),
    createAddress("0xa66"),
    createAddress("0xf00d"),
    "Test",
    ["3", "4"],
    "1000",
    "200",
    false,
    8,
  ],
];

const ABI: Interface = new Interface([
  abi.PAIR.getEvent("Mint").format("full"),
  abi.PAIR.getEvent("Burn").format("full"),
  "event Test(uint a, uint b)",
]);

const addLiquidityFinding = ([pair, sender, amount0, amount1, reserve0, reserve1]: string[]): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair Liquidity Action",
    description: "Large liquidity Added",
    protocol: "Impossible Finance",
    alertId: "IMPOSSIBLE-9-1",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: { pair, amount0, amount1, sender, reserve0, reserve1 },
  });

const removeLiquidityFinding = ([pair, sender, amount0, amount1, to, reserve0, reserve1]: string[]): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair Updated",
    description: "Large Liquidity Removed",
    protocol: "Impossible Finance",
    alertId: "IMPOSSIBLE-9-2",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: { pair, amount0, amount1, sender, to, reserve0, reserve1 },
  });

const router: Record<string, (_: string[]) => Finding> = {
  Burn: removeLiquidityFinding,
  Mint: addLiquidityFinding,
};

describe("Large add/remove Liquidity agent tests suite", () => {
  const factory: string = createAddress("0xf00d");
  const mockProvider = new MockEthersProvider();

  const mockPairsFetcher = new PairFetcher(factory, mockProvider as any);

  const handler: HandleTransaction = provideHandleTransaction(mockPairsFetcher, 20);

  beforeEach(() => {
    mockProvider.clear();
  });

  it("should report empty findings in txns without events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect/ignore events accordingly", async () => {
    for (let [address, token0, token1, realPair, event, params, reserve0, reserve1, emitFinding, block] of CASES) {
      // add call to token0, token1 of the pair
      mockProvider.addCallTo(address, block, abi.PAIR, "token0", { inputs: [], outputs: [token0] });
      mockProvider.addCallTo(address, block, abi.PAIR, "token1", { inputs: [], outputs: [token1] });

      // add call to getPair(token0,token1) from the factory.
      mockProvider.addCallTo(factory, block, abi.FACTORY, "getPair", { inputs: [token0, token1], outputs: [realPair] });

      // add call to getReserves.
      mockProvider.addCallTo(address, block - 1, abi.PAIR, "getReserves", {
        inputs: [],
        outputs: [BigNumber.from(reserve0), BigNumber.from(reserve1)],
      });

      const { data, topics } = ABI.encodeEventLog(ABI.getEvent(event), params);

      const tx: TransactionEvent = new TestTransactionEvent()
        .setBlock(block)
        .addAnonymousEventLog(address, data, ...topics);

      const findings: Finding[] = await handler(tx);
      const expected: Finding[] = [];
      if (emitFinding) expected.push(router[event]([address, ...params, reserve0, reserve1]));

      expect(findings).toStrictEqual(expected);
    }
  });

  it("should detect multiple events", async () => {
    const EVENTS: TestData = [CASES[5], CASES[0], CASES[1], CASES[4]];

    const block: number = 42;
    const expected: Finding[] = [];
    const tx: TestTransactionEvent = new TestTransactionEvent().setBlock(block);

    for (let [address, token0, token1, realPair, event, params, reserve0, reserve1, emitFinding] of EVENTS) {
      // add call to token0, token1 of the pair
      mockProvider.addCallTo(address, block, abi.PAIR, "token0", { inputs: [], outputs: [token0] });
      mockProvider.addCallTo(address, block, abi.PAIR, "token1", { inputs: [], outputs: [token1] });

      // add call to getPair(token0,token1) from the factory.
      mockProvider.addCallTo(factory, block, abi.FACTORY, "getPair", { inputs: [token0, token1], outputs: [realPair] });

      // add call to getReserves.
      mockProvider.addCallTo(address, block - 1, abi.PAIR, "getReserves", {
        inputs: [],
        outputs: [BigNumber.from(reserve0), BigNumber.from(reserve1)],
      });

      const { data, topics } = ABI.encodeEventLog(ABI.getEvent(event), params);

      tx.addAnonymousEventLog(address, data, ...topics);
      if (emitFinding) expected.push(router[event]([address, ...params, reserve0, reserve1]));
    }

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual(expected);
  });
});
