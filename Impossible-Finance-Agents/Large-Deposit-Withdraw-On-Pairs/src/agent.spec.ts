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
import { Interface } from "@ethersproject/abi";
import { provideHandleTransaction } from "./agent";

type TestData = [string, boolean, string, string[], string, string, boolean, number][];

// address, isPair, event, params, reserves0, reserve1, emit finding, block
const CASES: TestData = [
  // not pairs
  [createAddress("0xace17e"), false, "Mint", [createAddress('0x1a'), "1000", "2000"], "1000", "2000", false, 1], 
  [createAddress("0xca1d0"), false, "Burn", [createAddress('0x1b'), "2000", "3000", createAddress('0x2b')], "100", "200", false, 2], 
  // under threshold
  [createAddress("0xf11e7e"), true, "Mint", [createAddress('0x1c'), "1", "1"], "200", "200", false, 3], 
  [createAddress("0xc0c1do"), true, "Burn", [createAddress('0x1b'), "10", "3", createAddress('0x2b')], "4000", "200", false, 4],
  // over threshold
  [createAddress("0xe570fad0"), true, "Mint", [createAddress('0x1e'), "100", "200"], "10", "20", true, 5], 
  [createAddress("0xfee"), true, "Burn", [createAddress('0x1f'), "200", "40", createAddress('0x2f')], "1000", "200", true, 6], 
  // other events on pairs
  [createAddress("0x1ce"), true, "Test", ["1", "2"], "10", "20", false, 7], 
  [createAddress("0xf00d"), true, "Test", ["3", "4"], "1000", "200", false, 8], 
];

const ABI: Interface = new Interface([
  abi.PAIR.getEvent("Mint").format("full"),
  abi.PAIR.getEvent("Burn").format("full"),
  "event Test(uint a, uint b)",
]);

const addLiquidityFinding = (
  [pair, sender, amount0, amount1, reserve0, reserve1]: string[],
): Finding =>
  Finding.fromObject({
    name: "Impossible Finance Pair Liquidity Action",
    description: "Large liquidity Added",
    protocol: "Impossible Finance",
    alertId: "IMPOSSIBLE-9-1",
    type: FindingType.Info,
    severity: FindingSeverity.Info,
    metadata: { pair, amount0, amount1, sender, reserve0, reserve1 },
  });

const removeLiquidityFinding = (
  [pair, sender, amount0, amount1, to, reserve0, reserve1]: string[],
): Finding =>
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
  "Burn": removeLiquidityFinding,
  "Mint": addLiquidityFinding,
};

describe("Large add/remove Liquidity agent tests suite", () => {
  const factory: string = createAddress("0xf00d");
  const mockFetcher = {
    factory,
    getReserves: jest.fn(),
    isImpossiblePair: jest.fn(),
  };
  const handler: HandleTransaction = provideHandleTransaction(mockFetcher as any, 20);

  beforeEach(() => {
    mockFetcher.getReserves.mockClear();
    mockFetcher.isImpossiblePair.mockClear();
  });

  it("should report empty findings in txns without events", async () => {
    const tx: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual([]);
  });

  it("should detect/ignore events accordingly", async () => {
    for(let [address, isPair, event, params, reserve0, reserve1, emitFinding, block] of CASES) {
      when(mockFetcher.isImpossiblePair)
        .calledWith(block, address)
        .mockReturnValue(isPair);
      const { data, topics } = ABI.encodeEventLog(ABI.getEvent(event), params);
      when(mockFetcher.getReserves)
        .calledWith(block - 1, address)
        .mockReturnValueOnce({ reserve0, reserve1});
      const tx: TransactionEvent = new TestTransactionEvent()
        .setBlock(block)
        .addAnonymousEventLog(address, data, ...topics);
      
      const findings: Finding[] = await handler(tx);
      const expected: Finding[] = [];
      if(emitFinding)
        expected.push(router[event]([address, ...params, reserve0, reserve1]));

      expect(findings).toStrictEqual(expected);
    }
  });

  it("should detect multiple events", async () => {
    const EVENTS: TestData = [CASES[5], CASES[0], CASES[1], CASES[4]];

    const block: number = 42;
    const expected: Finding[] = [];
    const tx: TestTransactionEvent = new TestTransactionEvent().setBlock(block)
    for(let [address,, event, params, reserve0, reserve1,,] of EVENTS) {
      when(mockFetcher.isImpossiblePair)
        .calledWith(block, address)
        .mockReturnValue(true);
      const { data, topics } = ABI.encodeEventLog(ABI.getEvent(event), params);
      when(mockFetcher.getReserves)
        .calledWith(block - 1, address)
        .mockReturnValueOnce({ reserve0, reserve1});
        
      tx.addAnonymousEventLog(address, data, ...topics);
      
      expected.push(router[event]([address, ...params, reserve0, reserve1]));
    }
    const findings: Finding[] = await handler(tx);
    expect(findings).toStrictEqual(expected);
  });
});
