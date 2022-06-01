import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { PAIR_IFACE } from "./utils";
import PairFetcher from "./pair.fetcher";
import NetworkManager from "./network";

// format: [blockNumber, pair, token0, token1]
const testData: [number, string, string, string][] = [
  [10, createAddress("0xae1"), createAddress("0xab123"), createAddress("0xbb147")],
  [20, createAddress("0xbe2"), createAddress("0xab321"), createAddress("0xbb741")],
  [30, createAddress("0xae2"), createAddress("0xab456"), createAddress("0xbb258")],
  [40, createAddress("0xce3"), createAddress("0xab654"), createAddress("0xbb852")],
  [50, createAddress("0xde4"), createAddress("0xab444"), createAddress("0xbb777")],
];
// Format: [reserve0, reserve1, blockTimestampLast]
const testReserves: [BigNumber, BigNumber, number][] = [
  [BigNumber.from("123"), BigNumber.from("234"), 456],
  [BigNumber.from("678"), BigNumber.from("789"), 891],
  [BigNumber.from("321"), BigNumber.from("543"), 765],
  [BigNumber.from("987"), BigNumber.from("147"), 852],
  [BigNumber.from("369"), BigNumber.from("951"), 753],
];

const testFactory = createAddress("0xa1");

describe("PairFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager: NetworkManager = {
    factory: testFactory,
    networkMap: {},
    setNetwork: jest.fn(),
  };

  beforeEach(() => mockProvider.clear());

  const createToken0Call = (pairAddress: string, token0Address: string, blockNumber: number) => {
    mockProvider.addCallTo(pairAddress, blockNumber, PAIR_IFACE, "token0", {
      inputs: [],
      outputs: [token0Address],
    });
  };

  const createToken1Call = (pairAddress: string, token1Address: string, blockNumber: number) => {
    mockProvider.addCallTo(pairAddress, blockNumber, PAIR_IFACE, "token1", {
      inputs: [],
      outputs: [token1Address],
    });
  };

  const createGetReservesCall = (
    pairAddress: string,
    reserve0: BigNumber,
    reserve1: BigNumber,
    blockTimestampLast: number,
    blockNumber: number
  ) => {
    mockProvider.addCallTo(pairAddress, blockNumber, PAIR_IFACE, "getReserves", {
      inputs: [],
      outputs: [reserve0, reserve1, blockTimestampLast],
    });
  };

  it("should fetch token0 and use cache correctly", async () => {
    for (let [block, pair, token0] of testData) {
      createToken0Call(pair, token0, block);
      const fetcher: PairFetcher = new PairFetcher(pair, mockProvider as any);

      const fetchedToken0 = await fetcher.getToken0(block);
      expect(fetchedToken0.toLowerCase()).toStrictEqual(token0.toLowerCase());

      // clear mock to use cache
      // (clearing cache in for loop since we are creating
      // a fetcher instance for every pair address)
      mockProvider.clear();
      const clearedToken0 = await fetcher.getToken0(block);
      expect(clearedToken0.toLowerCase()).toStrictEqual(token0.toLowerCase());
    }
  });

  it("should fetch token1 and use cache correctly", async () => {
    for (let [block, pair, , token1] of testData) {
      createToken1Call(pair, token1, block);
      const fetcher: PairFetcher = new PairFetcher(pair, mockProvider as any);

      const fetchedToken1 = await fetcher.getToken1(block);
      expect(fetchedToken1.toLowerCase()).toStrictEqual(token1.toLowerCase());

      // clear mock to use cache
      // (clearing cache in for loop since we are creating
      // a fetcher instance for every pair address)
      mockProvider.clear();
      const clearedToken1 = await fetcher.getToken1(block);
      expect(clearedToken1.toLowerCase()).toStrictEqual(token1.toLowerCase());
    }
  });

  it("should fetch reserves and use cache correctly", async () => {
    for (let i = 0; i < testData.length; i++) {
      const [block, pair] = testData[i];
      const [reserve0, reserve1, blockTimestampLast] = testReserves[i];

      createGetReservesCall(pair, reserve0, reserve1, blockTimestampLast, block);
      const fetcher: PairFetcher = new PairFetcher(pair, mockProvider as any);
      const [fetchedReserve0, fetchedReserve1, fetchedBlockTimestampLast] = await fetcher.getReserves(block);

      expect(fetchedReserve0).toStrictEqual(reserve0);
      expect(fetchedReserve1).toStrictEqual(reserve1);
      expect(fetchedBlockTimestampLast).toStrictEqual(blockTimestampLast);

      // clear mock to use cache
      // (clearing cache in for loop since we are creating
      // a fetcher instance for every pair address)
      mockProvider.clear();
      const [clearedReserve0, clearedReserve1, clearedBlockTimestampLast] = await fetcher.getReserves(block);

      expect(clearedReserve0).toStrictEqual(reserve0);
      expect(clearedReserve1).toStrictEqual(reserve1);
      expect(clearedBlockTimestampLast).toStrictEqual(blockTimestampLast);
    }
  });
});
