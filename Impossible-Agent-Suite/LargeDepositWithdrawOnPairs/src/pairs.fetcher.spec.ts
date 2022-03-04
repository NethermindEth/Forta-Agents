import MockProvider from "./mock.provider";
import PairFetcher from "./pairs.fetcher";
import { createAddress } from "forta-agent-tools";
import { BigNumber } from "ethers";
import abi from "./abi";

const PAIRS: string[] = [
  createAddress("0xdef1a"),
  createAddress("0xdef1b"),
  createAddress("0xdef1c"),
  createAddress("0xdef1d"),
];

describe("PairFetcher test suite", () => {
  const factory: string = createAddress("0xdead");
  const mockProvider: MockProvider = new MockProvider();
  const fetcher: PairFetcher = new PairFetcher(factory, mockProvider as any);

  const initBlock = (block: number) => {
    for (let i = 0; i < PAIRS.length; ++i)
      mockProvider.addCallTo(factory, block, abi.FACTORY, "allPairs", {
        inputs: [i],
        outputs: [PAIRS[i]],
      });
    mockProvider.addCallTo(factory, block, abi.FACTORY, "allPairsLength", {
      inputs: [],
      outputs: [PAIRS.length],
    });
  };

  beforeEach(() => mockProvider.clear());

  it("should store the factory address correctly", async () => {
    for (let i = 0; i < 10; ++i) {
      const addr: string = createAddress(`0xDA0${i}`);
      const fetcher: PairFetcher = new PairFetcher(addr, mockProvider as any);

      expect(fetcher.factory).toStrictEqual(addr);
    }
  });

  it("should fetch the pairs", async () => {
    initBlock(20);

    const pairs: string[] = await fetcher.getAllPairs(20);
    expect(pairs).toStrictEqual(PAIRS);
  });

  it("should fetch the correct amount of pairs", async () => {
    initBlock(101);
    mockProvider.addCallTo(factory, 101, abi.FACTORY, "allPairsLength", {
      inputs: [],
      outputs: [2],
    });

    const pairs: string[] = await fetcher.getAllPairs(101);
    expect(pairs).toStrictEqual(PAIRS.slice(0, 2));
  });

  it("should fetch the reserves", async () => {
    mockProvider.addCallTo(PAIRS[0], 30, abi.PAIR, "getReserves", {
      inputs: [],
      outputs: [5, 10, 0],
    });
    mockProvider.addCallTo(PAIRS[2], 53, abi.PAIR, "getReserves", {
      inputs: [],
      outputs: [1, 3, 0],
    });

    expect(await fetcher.getReserves(53, PAIRS[2])).toStrictEqual({
      reserve0: BigNumber.from(1),
      reserve1: BigNumber.from(3),
    });
    expect(await fetcher.getReserves(30, PAIRS[0])).toStrictEqual({
      reserve0: BigNumber.from(5),
      reserve1: BigNumber.from(10),
    });

    // clear mock to check cached values
    mockProvider.clear();

    expect(await fetcher.getReserves(30, PAIRS[0])).toStrictEqual({
      reserve0: BigNumber.from(5),
      reserve1: BigNumber.from(10),
    });
    expect(await fetcher.getReserves(53, PAIRS[2])).toStrictEqual({
      reserve0: BigNumber.from(1),
      reserve1: BigNumber.from(3),
    });
  });
});
