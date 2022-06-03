import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { MULTICALL_IFACE, PAIR_IFACE } from "./utils";
import MulticallFetcher from "./multicall.fetcher";
import NetworkManager from "./network";

// format: [pairAddress, token0, token1, blockNumber]
const testTokenData: [string, string, string, number][] = [
  [createAddress("0xae1"), createAddress("0xab123"), createAddress("0xbb147"), 10],
  [createAddress("0xbe2"), createAddress("0xab321"), createAddress("0xbb741"), 20],
  [createAddress("0xae2"), createAddress("0xab456"), createAddress("0xbb258"), 30],
  [createAddress("0xce3"), createAddress("0xab654"), createAddress("0xbb852"), 40],
  [createAddress("0xde4"), createAddress("0xab444"), createAddress("0xbb777"), 50],
];
// Format: [pairAddress, reserve0, reserve1, blockTimestampLast, blockNumber]
const testReservesData: [string, BigNumber, BigNumber, number, number][] = [
  [createAddress("0xae1"), BigNumber.from("123"), BigNumber.from("234"), 456, 10],
  [createAddress("0xbe2"), BigNumber.from("678"), BigNumber.from("789"), 891, 20],
  [createAddress("0xae2"), BigNumber.from("321"), BigNumber.from("543"), 765, 30],
  [createAddress("0xce3"), BigNumber.from("987"), BigNumber.from("147"), 852, 40],
  [createAddress("0xde4"), BigNumber.from("369"), BigNumber.from("951"), 753, 50],
];

describe("MulticallFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager: NetworkManager = {
    factory: createAddress("0xa1"),
    multicall: createAddress("0xb2"),
    pairInitCodeHash: "0x0bbca9af0511ad1a1da383135cf3a8d2ac620e549ef9f6ae3a4c33c2fed0af91",
    networkMap: {},
    setNetwork: jest.fn(),
  };
  const fetcher: MulticallFetcher = new MulticallFetcher(mockNetworkManager.multicall, mockProvider as any);

  beforeEach(() => mockProvider.clear());

  const createAggregateCall = (
    multicallAddress: string,
    calls: string[][],
    returnData: string[],
    blockNumber: number
  ) => {
    mockProvider.addCallTo(multicallAddress, blockNumber, MULTICALL_IFACE, "aggregate", {
      inputs: [calls],
      outputs: [blockNumber, returnData],
    });
  };

  it("should fetch token addresses and use cache correctly", async () => {
    for (let [pairAddress, token0, token1, blockNumber] of testTokenData) {
      const tokenCalls: string[][] = [
        [pairAddress, PAIR_IFACE.encodeFunctionData("token0")],
        [pairAddress, PAIR_IFACE.encodeFunctionData("token1")],
      ];
      const tokenReturnData: string[] = [
        PAIR_IFACE.encodeFunctionResult("token0", [token0]),
        PAIR_IFACE.encodeFunctionResult("token1", [token1]),
      ];

      createAggregateCall(mockNetworkManager.multicall, tokenCalls, tokenReturnData, blockNumber);

      const [, returnedData] = await fetcher.aggregate(tokenCalls, blockNumber);
      const [[fetchedToken0], [fetchedToken1]] = [
        PAIR_IFACE.decodeFunctionResult("token0", returnedData[0]),
        PAIR_IFACE.decodeFunctionResult("token1", returnedData[1]),
      ];

      expect(fetchedToken0.toLowerCase()).toStrictEqual(token0);
      expect(fetchedToken1.toLowerCase()).toStrictEqual(token1);
    }

    mockProvider.clear();
    for (let [pairAddress, token0, token1, blockNumber] of testTokenData) {
      const tokenCalls: string[][] = [
        [pairAddress, PAIR_IFACE.encodeFunctionData("token0")],
        [pairAddress, PAIR_IFACE.encodeFunctionData("token1")],
      ];

      const [, returnedData] = await fetcher.aggregate(tokenCalls, blockNumber);
      const [[fetchedToken0], [fetchedToken1]] = [
        PAIR_IFACE.decodeFunctionResult("token0", returnedData[0]),
        PAIR_IFACE.decodeFunctionResult("token1", returnedData[1]),
      ];

      expect(fetchedToken0.toLowerCase()).toStrictEqual(token0);
      expect(fetchedToken1.toLowerCase()).toStrictEqual(token1);
    }
  });

  it("should fetch reserves and use cache correctly", async () => {
    for (let [pairAddress, reserve0, reserve1, blockTimestampLast, blockNumber] of testReservesData) {
      const reservesCall: string[][] = [[pairAddress, PAIR_IFACE.encodeFunctionData("getReserves")]];
      const reservesReturnData: string[] = [
        PAIR_IFACE.encodeFunctionResult("getReserves", [reserve0, reserve1, blockTimestampLast]),
      ];

      createAggregateCall(mockNetworkManager.multicall, reservesCall, reservesReturnData, blockNumber - 1);

      const [, returnedData] = await fetcher.aggregate(reservesCall, blockNumber - 1);
      const [fetchedReserve0, fetchedReserve1, fetchedBlockTimestampLast] = PAIR_IFACE.decodeFunctionResult(
        "getReserves",
        returnedData[0]
      );

      expect(fetchedReserve0).toStrictEqual(reserve0);
      expect(fetchedReserve1).toStrictEqual(reserve1);
      expect(fetchedBlockTimestampLast).toStrictEqual(blockTimestampLast);
    }

    mockProvider.clear();
    for (let [pairAddress, reserve0, reserve1, blockTimestampLast, blockNumber] of testReservesData) {
      const reservesCall: string[][] = [[pairAddress, PAIR_IFACE.encodeFunctionData("getReserves")]];

      const [, returnedData] = await fetcher.aggregate(reservesCall, blockNumber - 1);
      const [fetchedReserve0, fetchedReserve1, fetchedBlockTimestampLast] = PAIR_IFACE.decodeFunctionResult(
        "getReserves",
        returnedData[0]
      );

      expect(fetchedReserve0).toStrictEqual(reserve0);
      expect(fetchedReserve1).toStrictEqual(reserve1);
      expect(fetchedBlockTimestampLast).toStrictEqual(blockTimestampLast);
    }
  });
});
