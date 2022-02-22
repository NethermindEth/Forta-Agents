import MockProvider from "./mock.provider";
import PairFetcher from "./pairs.fetcher";
import { createAddress } from "forta-agent-tools";
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

  it("should store the factory address correctly", async () => {
    for (let i = 0; i < 10; ++i) {
      const addr: string = createAddress(`0xDA0${i}`);
      const fetcher: PairFetcher = new PairFetcher(addr, mockProvider as any);

      expect(fetcher.factoryAddress).toStrictEqual(addr);
    }
  });

  it("should fetch the pairs", async () => {
    initBlock(20);
    const fetcher: PairFetcher = new PairFetcher(factory, mockProvider as any);

    const pairs: string[] = await fetcher.getAllPairs(20);
    expect(pairs).toStrictEqual(PAIRS);
  });

  it("should fetch the correct amount of pairs", async () => {
    initBlock(101);
    mockProvider.addCallTo(factory, 101, abi.FACTORY, "allPairsLength", {
      inputs: [],
      outputs: [2],
    });
    const fetcher: PairFetcher = new PairFetcher(factory, mockProvider as any);

    const pairs: string[] = await fetcher.getAllPairs(101);
    expect(pairs).toStrictEqual(PAIRS.slice(0, 2));
  });
});
