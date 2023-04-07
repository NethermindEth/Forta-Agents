import ContractFetcher from "./contract.fetcher";
import { MockEthersProvider } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import fetch from "node-fetch";

jest.mock("node-fetch");
const { Response } = jest.requireActual("node-fetch");

const testKeys = {
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
  let fetcher: ContractFetcher;

  beforeAll(() => {
    fetcher = new ContractFetcher(mockProvider as any, testKeys);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch contract info correctly", async () => {
    const chainId = 1;
    const mockTxTo = createAddress("0x1238");

    const mockFetch = jest.mocked(fetch, true);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "OK",
          result: [
            {
              to: mockTxTo,
            },
          ],
        })
      )
    );

    const hasHighNumberOfTotalTxs = await fetcher.getContractInfo(mockTxTo, chainId, 1);
    expect([hasHighNumberOfTotalTxs]).toStrictEqual([false]);
  });
});
