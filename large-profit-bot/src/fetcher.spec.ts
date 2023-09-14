import { BigNumber } from "ethers";
import Fetcher from "./fetcher";
import { TOKEN_ABI } from "./utils";
import { Interface } from "ethers/lib/utils";
import { MockEthersProvider } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import fetch from "node-fetch";

jest.mock("node-fetch");
const { Response } = jest.requireActual("node-fetch");

// [blockNumber, name]
const TEST_DECIMALS: [number, number][] = [
  [10, 18],
  [20, 6],
  [30, 31],
  [40, 11],
  [50, 9],
];

// [blockNumber, token, totalSupply]
const TEST_TOTAL_SUPPLIES: [number, string, BigNumber][] = [
  [10, createAddress("0xa1"), BigNumber.from(100)],
  [20, createAddress("0xa2"), BigNumber.from(1000)],
  [30, createAddress("0xa3"), BigNumber.from(10000)],
  [40, createAddress("0xa4"), BigNumber.from(100000)],
  [50, createAddress("0xa5"), BigNumber.from(1000000)],
];

const TEST_BLOCK = 120;
const PROTOCOL_ADDRESS = createAddress("0xa1");
const tokenAddress = createAddress("0xa2");
const TOKEN_IFACE = new Interface(TOKEN_ABI);

const testKeys = {
  ethplorerApiKeys: ["Test2"],
  chainbaseApiKeys: ["Test21"],
  moralisApiKeys: ["Test3"],
  etherscanApiKeys: ["Test4"],
  optimisticEtherscanApiKeys: ["Test5"],
  bscscanApiKeys: ["Test6"],
  polygonscanApiKeys: ["Test7"],
  fantomscanApiKeys: ["Test8"],
  arbiscanApiKeys: ["Test9"],
  snowtraceApiKeys: ["Test10"],
};

describe("TokenInfoFetcher tests suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let fetcher: Fetcher;

  beforeAll(() => {
    fetcher = new Fetcher(mockProvider as any, testKeys);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch total supply and use cache correctly", async () => {
    for (let [block, token, totalSupply] of TEST_TOTAL_SUPPLIES) {
      mockProvider.addCallTo(token, block, TOKEN_IFACE, "totalSupply", {
        inputs: [],
        outputs: [totalSupply],
      });

      const fetchedTotalSupply = await fetcher.getTotalSupply(block, token);
      expect(fetchedTotalSupply).toStrictEqual(totalSupply);
    }
    expect(mockProvider.call).toBeCalledTimes(5);

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [block, token, totalSupply] of TEST_TOTAL_SUPPLIES) {
      const fetchedTotalSupply = await fetcher.getTotalSupply(block, token);
      expect(fetchedTotalSupply).toStrictEqual(totalSupply);
    }
    expect(mockProvider.call).toBeCalledTimes(5);

    mockProvider.clear();
  });

  it("should fetch token decimals and use cache correctly", async () => {
    for (let [block, decimals] of TEST_DECIMALS) {
      mockProvider.addCallTo(tokenAddress, block, TOKEN_IFACE, "decimals", {
        inputs: [],
        outputs: [decimals],
      });
      const fetchedDecimals = await fetcher.getDecimals(block, tokenAddress);
      expect(fetchedDecimals).toStrictEqual(decimals);
    }
    expect(mockProvider.call).toBeCalledTimes(5);

    // Fetching decimals if token does not have decimals method
    const fetchedDecimals = await fetcher.getDecimals(121, createAddress("0x1234"));
    expect(fetchedDecimals).toStrictEqual(18);

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [block, decimals] of TEST_DECIMALS) {
      const fetchedDecimals = await fetcher.getDecimals(block, tokenAddress);
      expect(fetchedDecimals).toStrictEqual(decimals);
    }
  });

  it("should fetch the value in USD correctly", async () => {
    const chainId = 1;

    const mockFetch = jest.mocked(fetch, true);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ ethereum: { usd: 1.2 } })));

    const fetchedNativeValue = await fetcher.getValueInUsd(TEST_BLOCK, chainId, "2000000000000000000", "native");
    expect(fetchedNativeValue).toStrictEqual(2.4);

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ coins: { "ethereum:0x00000000000000000000000000000000000000a2": { price: 3 } } }))
    );

    mockProvider.addCallTo(tokenAddress, TEST_BLOCK, TOKEN_IFACE, "decimals", {
      inputs: [],
      outputs: [18],
    });
    const fetchedTokenValue = await fetcher.getValueInUsd(TEST_BLOCK, chainId, "4000000000000000000", tokenAddress);
    expect(fetchedTokenValue).toStrictEqual(12);
  });

  it("should fetch the verification status of a contract correctly", async () => {
    const chainId = 1;

    const mockFetch = jest.mocked(fetch, true);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ message: "OK", status: "1" })));

    const isVerified = await fetcher.isContractVerified(PROTOCOL_ADDRESS, chainId);
    expect(isVerified).toStrictEqual(true);

    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ message: "OK", status: "0" })));

    const isVerified2 = await fetcher.isContractVerified(PROTOCOL_ADDRESS, chainId);
    expect(isVerified2).toStrictEqual(false);
  });

  it("should fetch contract info correctly", async () => {
    const chainId = 1;
    const mockTxFrom = createAddress("0x1238");

    const mockFetch = jest.mocked(fetch, true);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "OK",
          result: [
            {
              from: mockTxFrom,
            },
          ],
        })
      )
    );

    const [isFirstInteraction, hasHighNumberOfTotalTxs] = await fetcher.getContractInfo(
      PROTOCOL_ADDRESS,
      mockTxFrom,
      chainId
    );
    expect([isFirstInteraction, hasHighNumberOfTotalTxs]).toStrictEqual([true, false]);
  });

  it("should fetch the contract creator correctly", async () => {
    const chainId = 1;
    const mockContractCreator = createAddress("0x1237");
    const mockFetch = jest.mocked(fetch, true);

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "OK",
          result: [
            {
              contractCreator: mockContractCreator,
            },
          ],
        })
      )
    );

    const contractCreator = await fetcher.getContractCreator(PROTOCOL_ADDRESS, chainId);
    expect(contractCreator).toStrictEqual(mockContractCreator);
  });
});
