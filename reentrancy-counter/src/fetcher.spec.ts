import { BigNumber } from "ethers";
import Fetcher from "./fetcher";
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

const testKeys = {
  apiKeys: {
    reentrancy: {
      etherscanApiKeys: ["TestEtherscan"],
      fantomscanApiKeys: ["TestFantomscan"],
    },
  },
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

  it("should determine if a contract is high tx count correctly", async () => {
    const chainId = 1;
    const CONTRACT_TRANSACTION_COUNT_THRESHOLD = 10000; // Make sure this matches the threshold in your function

    // Generate 10,000 transaction objects
    const transactions = Array.from({ length: CONTRACT_TRANSACTION_COUNT_THRESHOLD }, (_, index) => ({
      from: createAddress(`0x1234${index}`),
      hash: `txEventHash${index}`,
    }));

    const mockFetch = jest.mocked(fetch);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "OK",
          result: transactions,
        })
      )
    );
    const isHighTxCountContract = await fetcher.isHighTxCountContract(PROTOCOL_ADDRESS, 34543543, chainId);
    expect(isHighTxCountContract).toStrictEqual(true);
  });
});
