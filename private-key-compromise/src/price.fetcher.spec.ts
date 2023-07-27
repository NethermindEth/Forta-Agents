import Fetcher from "./price.fetcher";
import { TOKEN_ABI } from "./utils";
import { Interface } from "ethers/lib/utils";
import { MockEthersProvider } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import fetch from "node-fetch";

jest.mock("node-fetch");
const { Response } = jest.requireActual("node-fetch");

const TEST_BLOCK = 120;
const tokenAddress = createAddress("0xa2");
const TOKEN_IFACE = new Interface(TOKEN_ABI);

describe("TokenInfoFetcher tests suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let fetcher: Fetcher;

  beforeAll(() => {
    fetcher = new Fetcher(mockProvider as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch the value in USD correctly", async () => {
    const chainId = 1;

    const mockFetch = jest.mocked(fetch, true);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ ethereum: { usd: 1.2 } })));

    const fetchedNativeValue = await fetcher.getValueInUsd(TEST_BLOCK, chainId, "2000000000000000000", "native");
    expect(fetchedNativeValue).toStrictEqual(2.4);

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ "0x00000000000000000000000000000000000000a2": { usd: 3 } }))
    );

    mockProvider.addCallTo(tokenAddress, TEST_BLOCK, TOKEN_IFACE, "decimals", {
      inputs: [],
      outputs: [18],
    });
    const fetchedTokenValue = await fetcher.getValueInUsd(TEST_BLOCK, chainId, "4000000000000000000", tokenAddress);
    expect(fetchedTokenValue).toStrictEqual(12);
  });
});
