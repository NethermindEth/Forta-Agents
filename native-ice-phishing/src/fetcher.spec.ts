import { MockEthersProvider } from "forta-agent-tools/lib/test";
import DataFetcher from "./fetcher";
import { createAddress } from "forta-agent-tools";
import fetch from "node-fetch";
import { when } from "jest-when";

jest.mock("node-fetch");
const { Response } = jest.requireActual("node-fetch");

// [code, address, isEOA]
const TEST_RECEIVERS: [string, string, boolean][] = [
  ["0x", createAddress("0xa1"), true],
  ["0xababa", createAddress("0xa2"), false],
  ["0x", createAddress("0xa3"), true],
  ["0x", createAddress("0xa4"), true],
  ["0xccc", createAddress("0xa5"), false],
];

const TEST_SIGNATURES: [string, string][] = [
  ["0x12345678", "transfer(address,uint256)"],
  ["0x12345679", "transferFrom(address, address,uint256)"],
  ["0x12345670", "approve(address,uint256)"],
  ["0x12345671", "mint(address,uint256)"],
  ["0x12345672", "burn(address,uint256)"],
];

const testKeys = {
  etherscanApiKeys: ["Test4"],
  optimisticEtherscanApiKeys: ["Test5"],
  bscscanApiKeys: ["Test6"],
  polygonscanApiKeys: ["Test7"],
  fantomscanApiKeys: ["Test8"],
  arbiscanApiKeys: ["Test9"],
  snowtraceApiKeys: ["Test10"],
};

class MockEthersProviderExtended extends MockEthersProvider {
  public getCode: any;

  constructor() {
    super();
    this.getCode = jest.fn();
  }

  public setCode(address: string, code: string): MockEthersProviderExtended {
    when(this.getCode)
      .calledWith(address)
      .mockReturnValue(Promise.resolve(code));
    return this;
  }
}

describe("DatFetcher tests suite", () => {
  const mockProvider: MockEthersProviderExtended =
    new MockEthersProviderExtended();
  let fetcher: DataFetcher;

  beforeAll(() => {
    fetcher = new DataFetcher(mockProvider as any, testKeys);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return if the receiver is an EOA or not and use cache correctly", async () => {
    for (let [code, address, isEoa] of TEST_RECEIVERS) {
      mockProvider.setCode(address, code);
      const fetchedIsEoa = await fetcher.isEoa(address);
      expect(fetchedIsEoa).toStrictEqual(isEoa);
    }

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [, address, isEoa] of TEST_RECEIVERS) {
      const fetchedIsEoa = await fetcher.isEoa(address);
      expect(fetchedIsEoa).toStrictEqual(isEoa);
    }

    mockProvider.clear();
  });

  it("should fetch function signature and use cache correctly", async () => {
    const mockFetch = jest.mocked(fetch, true);

    for (let [input, sig] of TEST_SIGNATURES) {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(sig)));
      const fetchedSignature = await fetcher.getSignature(input);
      expect(fetchedSignature).toStrictEqual('"' + sig + '"');
    }

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [input, sig] of TEST_SIGNATURES) {
      const fetchedSignature = await fetcher.getSignature(input);
      expect(fetchedSignature).toStrictEqual('"' + sig + '"');
    }
  });

  it("should fetch contract info correctly", async () => {
    const chainId = 1;
    const mockTxFrom = createAddress("0x1238");
    const mockTxTo = createAddress("0x1239");

    const mockFetch = jest.mocked(fetch, true);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: "OK",
          result: [
            {
              from: mockTxFrom,
              hash: "0xabcd",
            },
          ],
        })
      )
    );

    const [isFirstInteraction, hasHighNumberOfTotalTxs] =
      await fetcher.getAddressInfo(mockTxTo, mockTxFrom, chainId, "0xabcd");
    expect([isFirstInteraction, hasHighNumberOfTotalTxs]).toStrictEqual([
      true,
      false,
    ]);
  });
});
