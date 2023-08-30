import { MockEthersProvider } from "forta-agent-tools/lib/test";
import { GetFloorPriceResponse } from "alchemy-sdk";
import DataFetcher from "./fetcher";

export class ExtendedMockEthersProvider extends MockEthersProvider {
  public getTransaction: any;
  public getTransactionReceipt: any;

  constructor() {
    super();
    this.getTransaction = jest.fn();
    this.getTransactionReceipt = jest.fn();
  }
}

describe("DataFetcher tests suite", () => {
  let mockProvider: ExtendedMockEthersProvider;
  let fetcher: DataFetcher;

  beforeAll(() => {
    mockProvider = new ExtendedMockEthersProvider();
    const apiKeys = {
      victimLossKeys: {
        alchemyApiKey: "alchemy",
      },
      generalApiKeys: {
        ZETTABLOCK: ["zettablock"],
      },
    };
    fetcher = new DataFetcher(mockProvider as any, apiKeys);
  });

  it("should fetch transaction receipt with retries", async () => {
    //1st call fails, 2nd is successful
    mockProvider.getTransactionReceipt = jest
      .fn()
      .mockRejectedValueOnce(new Error("Error"))
      .mockResolvedValueOnce({ status: 1 });

    const txHash = "0x123abc";
    const receipt = await fetcher.getTransactionReceipt(txHash);

    expect(receipt).toStrictEqual({ status: 1 });
    expect(mockProvider.getTransactionReceipt).toHaveBeenCalledTimes(2);
  });

  it("should fetch transaction with retries", async () => {
    //1st call fails, 2nd is successful
    mockProvider.getTransaction = jest
      .fn()
      .mockRejectedValueOnce(new Error("Error"))
      .mockResolvedValueOnce({ hash: "0x123abc" });

    const txHash = "0x123abc";
    const transaction = await fetcher.getTransaction(txHash);

    expect(transaction).toStrictEqual({ hash: "0x123abc" });
    expect(mockProvider.getTransaction).toHaveBeenCalledTimes(2);
  });

  it("should fetch native token price", async () => {
    let fetchCallCount = 0;

    global.fetch = jest.fn(() => {
      fetchCallCount++;
      if (fetchCallCount === 1) {
        return Promise.reject(new Error("First fetch intentionally failed"));
      }
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            coins: {
              "coingecko:ethereum": {
                symbol: "ETH",
                price: 1720.64,
                timestamp: 1693323468,
                confidence: 0.99,
              },
            },
          }),
      }) as Promise<Response>;
    });

    const nativeTokenPrice = await fetcher.getNativeTokenPrice(1693323468);
    expect(nativeTokenPrice).toStrictEqual(1720.64);

    expect(global.fetch).toHaveBeenCalledTimes(2); // 2 calls: 1st failure + 1 retry success

    const nativeTokenPriceCached = await fetcher.getNativeTokenPrice(
      1693323468
    );
    expect(nativeTokenPriceCached).toStrictEqual(1720.64);
    expect(global.fetch).toHaveBeenCalledTimes(2); // No extra calls, cached value used
  });

  it("should fetch floor price in ETH correctly", async () => {
    let fetchCallCount = 0;

    const mockGetFloorPrice: (
      contractAddress: string
    ) => Promise<GetFloorPriceResponse> = async () => {
      fetchCallCount++;

      if (fetchCallCount === 1) {
        throw new Error("First fetch intentionally failed");
      }

      const mockResponse: GetFloorPriceResponse = {
        openSea: {
          floorPrice: 42,
          priceCurrency: "ETH",
          collectionUrl: "url",
          retrievedAt: "2023-08-30T00:00:00.000Z",
        },
        looksRare: {
          floorPrice: 43,
          priceCurrency: "ETH",
          collectionUrl: "url",
          retrievedAt: "2023-08-31T00:00:00.000Z", // Latest
        },
      };

      return mockResponse;
    };

    fetcher.alchemy.nft.getFloorPrice = mockGetFloorPrice;

    const floorPriceInEth = await fetcher.getFloorPriceInEth("nftAddress");
    expect(floorPriceInEth).toStrictEqual(43);

    expect(fetchCallCount).toBe(2); // 2 calls: 1st failure + 1 retry success

    // LooksRare returning error case
    const mockGetFloorPrice2: (
      contractAddress: string
    ) => Promise<GetFloorPriceResponse> = async () => {
      const mockResponse: GetFloorPriceResponse = {
        openSea: {
          floorPrice: 142,
          priceCurrency: "ETH",
          collectionUrl: "url",
          retrievedAt: "2023-08-30T00:00:00.000Z",
        },
        looksRare: {
          error: "error",
        },
      };

      return mockResponse;
    };

    fetcher.alchemy.nft.getFloorPrice = mockGetFloorPrice2;

    const floorPriceInEth2 = await fetcher.getFloorPriceInEth("nftAddress2");
    expect(floorPriceInEth2).toStrictEqual(142);

    // Both marketplaces returning error case
    const mockGetFloorPrice3: (
      contractAddress: string
    ) => Promise<GetFloorPriceResponse> = async () => {
      const mockResponse: GetFloorPriceResponse = {
        openSea: {
          error: "error",
        },
        looksRare: {
          error: "error",
        },
      };

      return mockResponse;
    };

    fetcher.alchemy.nft.getFloorPrice = mockGetFloorPrice3;

    const floorPriceInEth3 = await fetcher.getFloorPriceInEth("nftAddress3");
    expect(floorPriceInEth3).toStrictEqual(0); // Fallback to 0
  });

  it("should fetch NFT collection floor price", async () => {
    const nftAddress = "nftAddress";
    const timestamp = 1693323468;
    const ethPriceInUsd = 1720.64;
    const floorPriceInEth = 42;

    let nativeTokenPriceCallCount = 0;

    const mockGetNativeTokenPrice = async () => {
      nativeTokenPriceCallCount++;
      return ethPriceInUsd;
    };

    let floorPriceInEthCallCount = 0;

    const mockGetFloorPriceInEth = async () => {
      floorPriceInEthCallCount++;
      return floorPriceInEth;
    };

    fetcher.getNativeTokenPrice = mockGetNativeTokenPrice;
    fetcher.getFloorPriceInEth = mockGetFloorPriceInEth;

    const nftCollectionFloorPrice = await fetcher.getNftCollectionFloorPrice(
      nftAddress,
      timestamp
    );

    const expectedFloorPriceInUsd = floorPriceInEth * ethPriceInUsd;
    expect(nftCollectionFloorPrice).toStrictEqual(expectedFloorPriceInUsd);

    // Test caching behavior
    const nftCollectionFloorPriceCached =
      await fetcher.getNftCollectionFloorPrice(nftAddress, timestamp);
    expect(nftCollectionFloorPriceCached).toStrictEqual(
      expectedFloorPriceInUsd
    );

    expect(nativeTokenPriceCallCount).toBe(1); // Native token price should be called only once
    expect(floorPriceInEthCallCount).toBe(1); // Floor price in ETH should be called only once
  });

  it("should fetch scammer's ERC721 transfers", async () => {
    const scammerAddress = "0xScammer";
    const transferOccurrenceTimeWindow = 90;
    const erc721TransfersMock = [
      {
        block_time: "2023-08-30T12:00:00.000Z",
        contract_address: "0x1234",
        from_address: "0xaabb",
        name: "CryptoKitties",
        symbol: "CK",
        to_address: "0x1122",
        token_id: "12",
        transaction_hash: "0xabcde",
      },
      {
        block_time: "2023-08-29T10:30:00.000Z",
        contract_address: "0x9876a",
        from_address: "0xaabbccdd",
        name: "CryptoPunks",
        symbol: "CP",
        to_address: "0x778899",
        token_id: "4567",
        transaction_hash: "0x987654",
      },
    ];

    let fetchCallCount = 0;

    // Mock fetch response
    global.fetch = jest.fn(async () => {
      fetchCallCount++;

      if (fetchCallCount === 1) {
        throw new Error("First fetch intentionally failed");
      }

      return Promise.resolve({
        json: () => Promise.resolve({ data: { records: erc721TransfersMock } }),
      }) as Promise<Response>;
    });

    const erc721Transfers = await fetcher.getScammerErc721Transfers(
      scammerAddress,
      transferOccurrenceTimeWindow
    );

    expect(erc721Transfers).toStrictEqual(erc721TransfersMock);
    expect(fetchCallCount).toBe(2); // 2 calls: 1st failure + 1 retry success
  });
});
