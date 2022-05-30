import PairFetcher from "./pairs.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import abi from "./abi";

// pair, block, factory, token0, token1
const CASES: [string, number, string, string, string][] = [
  [createAddress("0xda00"), 12, createAddress("0xfac70"), createAddress("0xabc1"), createAddress("0xdef1")],
  [createAddress("0xda01"), 13, createAddress("0xfac79"), createAddress("0xabc0"), createAddress("0xd3f1")],
  [createAddress("0xda03"), 14, createAddress("0xfac78"), createAddress("0xabc2"), createAddress("0xdefa1")],
  [createAddress("0xda05"), 15, createAddress("0xfac77"), createAddress("0xabc3"), createAddress("0xdef1def")],
  [createAddress("0xda07"), 16, createAddress("0xfac76"), createAddress("0xabc5"), createAddress("0xdef1213")],
  [createAddress("0xda09"), 17, createAddress("0xfac75"), createAddress("0xabc1"), createAddress("0xdef12")],
];

describe("PairFetcher test suite", () => {
  const factory: string = createAddress("0xdead");
  const mockProvider = new MockEthersProvider();
  const fetcher: PairFetcher = new PairFetcher(factory, mockProvider as any);

  beforeEach(() => mockProvider.clear());

  it("should store the factory address correctly", async () => {
    for (let i = 0; i < 10; ++i) {
      const addr: string = createAddress(`0xDA0${i}`);
      const fetcher: PairFetcher = new PairFetcher(addr, mockProvider as any);

      expect(fetcher.factoryAddress).toStrictEqual(addr);
    }
  });

  it("should return false in calls to isImpossiblePair for address that doesn't have token0", async () => {
    for (let [addr, block, , , token1] of CASES) {
      mockProvider.addCallTo(addr, block, abi.PAIR, "token1", { inputs: [], outputs: [token1] });
      // no mock initialization for token0 so calls to token0 should return undefined
      expect(await fetcher.isImpossiblePair(block, addr)).toStrictEqual(false);
    }
  });

  it("should return false in calls to isImpossiblePair for address that doesn't have token1", async () => {
    for (let [addr, block, , token0] of CASES) {
      mockProvider.addCallTo(addr, block, abi.PAIR, "token0", { inputs: [], outputs: [token0] });
      // no mock initialization for token1 so calls to token1 should return undefined
      expect(await fetcher.isImpossiblePair(block, addr)).toStrictEqual(false);
    }
  });

  it("should return false in calls to isImpossiblePair when the factory mismatch", async () => {
    for (let [addr, block, factory, token0, token1] of CASES) {
      mockProvider
        .addCallTo(addr, block, abi.PAIR, "token0", { inputs: [], outputs: [token0] })
        .addCallTo(addr, block, abi.PAIR, "token1", { inputs: [], outputs: [token1] })
        .addCallTo(factory, block, abi.FACTORY, "getPair", {
          inputs: [token0, token1],
          outputs: [createAddress(`0xdead${block}`)],
        });
      const fetcher: PairFetcher = new PairFetcher(factory, mockProvider as any);
      expect(await fetcher.isImpossiblePair(block, addr)).toStrictEqual(false);
    }
  });

  it("should return true in calls to isImpossiblePair in valid pairs", async () => {
    for (let [pair, block, factory, token0, token1] of CASES) {
      mockProvider
        .addCallTo(pair, block, abi.PAIR, "token0", { inputs: [], outputs: [token0] })
        .addCallTo(pair, block, abi.PAIR, "token1", { inputs: [], outputs: [token1] })
        .addCallTo(factory, block, abi.FACTORY, "getPair", { inputs: [token0, token1], outputs: [pair] });
      const fetcher: PairFetcher = new PairFetcher(factory, mockProvider as any);
      expect(await fetcher.isImpossiblePair(block, pair)).toStrictEqual(true);

      // clear mock to use values in cache
      mockProvider.clear();
      expect(await fetcher.isImpossiblePair(block, pair)).toStrictEqual(true);
    }
  });

  it("should fetch the reserves", async () => {
    mockProvider.addCallTo(CASES[0][0], 30, abi.PAIR, "getReserves", {
      inputs: [],
      outputs: [5, 10],
    });
    mockProvider.addCallTo(CASES[2][0], 53, abi.PAIR, "getReserves", {
      inputs: [],
      outputs: [1, 3],
    });

    expect(await fetcher.getReserves(53, CASES[2][0])).toStrictEqual({
      reserve0: BigNumber.from(1),
      reserve1: BigNumber.from(3),
    });
    expect(await fetcher.getReserves(30, CASES[0][0])).toStrictEqual({
      reserve0: BigNumber.from(5),
      reserve1: BigNumber.from(10),
    });

    // clear mock to check cached values
    mockProvider.clear();

    expect(await fetcher.getReserves(30, CASES[0][0])).toStrictEqual({
      reserve0: BigNumber.from(5),
      reserve1: BigNumber.from(10),
    });
    expect(await fetcher.getReserves(53, CASES[2][0])).toStrictEqual({
      reserve0: BigNumber.from(1),
      reserve1: BigNumber.from(3),
    });
  });
});
