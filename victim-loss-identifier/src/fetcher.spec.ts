import { MockEthersProvider } from "forta-agent-tools/lib/test";
import { GetFloorPriceResponse } from "alchemy-sdk";
import DataFetcher from "./fetcher";
import { FP_BUYER_TO_SELLER_MIN_TRANSFERRED_TOKEN_VALUE } from "./constants";

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
      apiKeys: {
        victimLoss: {
          alchemyApiKey: "alchemy",
          etherscanApiKeys: ["etherscan"],
          optimisticEtherscanApiKeys: ["optimisticEtherscan"],
          bscscanApiKeys: ["bscscan"],
          polygonscanApiKeys: ["polygonscan"],
          fantomscanApiKeys: ["fantomscan"],
          arbiscanApiKeys: ["arbiscan"],
          snowtraceApiKeys: ["snowtrace"],
        },
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

    await fetcher.getTransactionReceipt(txHash);
    expect(mockProvider.getTransactionReceipt).toHaveBeenCalledTimes(2); // No extra call
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

    await fetcher.getTransaction(txHash);
    expect(mockProvider.getTransaction).toHaveBeenCalledTimes(2); // No extra call
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

    const nativeTokenPriceCached = await fetcher.getNativeTokenPrice(1693323468);
    expect(nativeTokenPriceCached).toStrictEqual(1720.64);
    expect(global.fetch).toHaveBeenCalledTimes(2); // No extra calls, cached value used
  });

  it("should fetch ERC20 token price", async () => {
    const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
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
              "ethereum:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": {
                decimals: 18,
                symbol: "WETH",
                price: 3381.798048538271,
                timestamp: 1648680228,
              },
            },
          }),
      }) as Promise<Response>;
    });

    mockProvider.getBlock = jest.fn().mockResolvedValue({
      timestamp: 1648680228,
    });

    const wethPrice = await fetcher.getErc20Price(WETH, 1234, 1);
    expect(wethPrice).toStrictEqual(3381.798048538271);

    expect(global.fetch).toHaveBeenCalledTimes(2); // 2 calls: 1st failure + 1 retry success

    const wethPriceCached = await fetcher.getErc20Price(WETH, 1234, 1);
    expect(wethPriceCached).toStrictEqual(3381.798048538271);
    expect(global.fetch).toHaveBeenCalledTimes(2); // No extra calls, cached value used
  });

  it("should fetch floor price in ETH correctly", async () => {
    let fetchCallCount = 0;

    const mockGetFloorPrice: (contractAddress: string) => Promise<GetFloorPriceResponse> = async () => {
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
    const mockGetFloorPrice2: (contractAddress: string) => Promise<GetFloorPriceResponse> = async () => {
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
    const mockGetFloorPrice3: (contractAddress: string) => Promise<GetFloorPriceResponse> = async () => {
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
    const blockNumber = 123;
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

    mockProvider.getBlock = jest.fn().mockResolvedValue({
      timestamp: timestamp,
    });

    const nftCollectionFloorPrice = await fetcher.getNftCollectionFloorPrice(nftAddress, blockNumber);

    const expectedFloorPriceInUsd = floorPriceInEth * ethPriceInUsd;
    expect(nftCollectionFloorPrice).toStrictEqual(expectedFloorPriceInUsd);

    // Test caching behavior
    const nftCollectionFloorPriceCached = await fetcher.getNftCollectionFloorPrice(nftAddress, blockNumber);
    expect(nftCollectionFloorPriceCached).toStrictEqual(expectedFloorPriceInUsd);

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

    const erc721Transfers = await fetcher.getScammerErc721Transfers(scammerAddress, transferOccurrenceTimeWindow);

    expect(erc721Transfers).toStrictEqual(erc721TransfersMock);
    expect(fetchCallCount).toBe(2); // 2 calls: 1st failure + 1 retry success
  });

  it("should check if buyer has transferred token to seller using ERC20 transfers", async () => {
    const buyerAddress = "0x1234";
    const sellerAddresses = ["0x5678", "0x9abc"];
    const chainId = 56;
    const blockNumber = 12345;

    // Mock ERC20 transfers
    const erc20TransfersMock = [
      { from: buyerAddress, to: sellerAddresses[0], contractAddress: "0xTokenA" },
      { from: sellerAddresses[0], to: buyerAddress, contractAddress: "0xTokenB" }, // Will not be processed
      { from: buyerAddress, to: sellerAddresses[1], contractAddress: "0xTokenC" },
    ];

    // Mock getErc20Price
    fetcher.getErc20Price = jest
      .fn()
      .mockResolvedValueOnce(FP_BUYER_TO_SELLER_MIN_TRANSFERRED_TOKEN_VALUE - 1) // Mocking a price lower than the threshold for "0xTokenA"
      .mockResolvedValueOnce(FP_BUYER_TO_SELLER_MIN_TRANSFERRED_TOKEN_VALUE + 1); // Mocking a price higher than the threshold for "0xTokenC"

    fetcher.getERC20TransfersUrl = jest.fn().mockReturnValue("mock-erc20-url");
    fetcher.getERC721TransfersUrl = jest.fn().mockReturnValue("mock-erc721-url");

    // Mock fetch response
    global.fetch = jest.fn(async (url) => {
      if (url === "mock-erc20-url") {
        return Promise.resolve({
          json: () => Promise.resolve({ message: "", result: erc20TransfersMock }),
        }) as Promise<Response>;
      } else if (url === "mock-erc721-url") {
        return Promise.resolve({
          json: () => Promise.resolve({ message: "", result: [] }),
        }) as Promise<Response>;
      } else {
        throw new Error(`Unexpected URL: ${url}`);
      }
    });

    const result = await fetcher.hasBuyerTransferredTokenToSeller(buyerAddress, sellerAddresses, chainId, blockNumber);

    expect(result).toBe(true); // Expecting true because ERC20 transfer amount is above the threshold
    expect(fetcher.getERC20TransfersUrl).toHaveBeenCalledWith(buyerAddress, blockNumber, chainId);
    expect(fetcher.getERC721TransfersUrl).toHaveBeenCalledWith(buyerAddress, blockNumber, chainId);
    expect(fetcher.getErc20Price).toHaveBeenCalledWith("0xTokenA", blockNumber, 56);
    expect(fetcher.getErc20Price).toHaveBeenCalledWith("0xTokenC", blockNumber, 56); // Previous price fetched was under threshold, so we're checking this as well
  });

  it("should check if buyer has transferred token to seller using ERC721 transfers", async () => {
    const buyerAddress = "0x12345";
    const sellerAddresses = ["0x45678", "0x89abc"];
    const chainId = 1;
    const blockNumber = 123456;

    // Mock ERC721 transfers
    const erc721TransfersMock = [
      { from: buyerAddress, to: sellerAddresses[0], contractAddress: "0xNFTA" },
      { from: sellerAddresses[0], to: buyerAddress, contractAddress: "0xNFTB" }, // Will not be processed
      { from: buyerAddress, to: sellerAddresses[1], contractAddress: "0xNFTC" },
    ];

    //  Mock getNftCollectionFloorPrice
    fetcher.getNftCollectionFloorPrice = jest
      .fn()
      .mockResolvedValueOnce(FP_BUYER_TO_SELLER_MIN_TRANSFERRED_TOKEN_VALUE - 1) // Mocking a price lower than the threshold for "0xNFTA"
      .mockResolvedValueOnce(FP_BUYER_TO_SELLER_MIN_TRANSFERRED_TOKEN_VALUE + 1); // Mocking a price higher than the threshold for "0xNFTC"

    fetcher.getERC20TransfersUrl = jest.fn().mockReturnValue("mock-erc20-url");
    fetcher.getERC721TransfersUrl = jest.fn().mockReturnValue("mock-erc721-url");

    // Mock fetch response
    global.fetch = jest.fn(async (url) => {
      if (url === "mock-erc20-url") {
        return Promise.resolve({
          json: () => Promise.resolve({ message: "", result: [] }),
        }) as Promise<Response>;
      } else if (url === "mock-erc721-url") {
        return Promise.resolve({
          json: () => Promise.resolve({ message: "", result: erc721TransfersMock }),
        }) as Promise<Response>;
      } else {
        throw new Error(`Unexpected URL: ${url}`);
      }
    });

    const result = await fetcher.hasBuyerTransferredTokenToSeller(buyerAddress, sellerAddresses, chainId, blockNumber);

    expect(result).toBe(true); // Expecting true because ERC721 floor price is above the threshold
    expect(fetcher.getERC20TransfersUrl).toHaveBeenCalledWith(buyerAddress, blockNumber, chainId);
    expect(fetcher.getERC721TransfersUrl).toHaveBeenCalledWith(buyerAddress, blockNumber, chainId);
    expect(fetcher.getNftCollectionFloorPrice).toHaveBeenCalledWith("0xNFTA", blockNumber);
    expect(fetcher.getNftCollectionFloorPrice).toHaveBeenCalledWith("0xNFTC", blockNumber);
  });
});
