import { providers } from "ethers";
import { Network, Alchemy, GetFloorPriceResponse, FloorPriceMarketplace } from "alchemy-sdk";
import { LRUCache } from "lru-cache";
import { ApiKeys, Erc721Transfer, CoinData, EtherscanApiResponse } from "./types";
import { etherscanApis } from "./utils/utils";
import { FP_BUYER_TO_SELLER_MIN_TRANSFERRED_TOKEN_VALUE, ONE_DAY_IN_SECS } from "./constants";

export default class DataFetcher {
  provider: providers.Provider;
  private apiKeys: ApiKeys;
  alchemy: Alchemy;
  private ethPriceCache: LRUCache<number, number>;
  private floorPriceCache: LRUCache<string, number>;
  private erc20PriceCache: LRUCache<string, number>;
  private txReceiptCache: LRUCache<string, providers.TransactionReceipt>;
  private txResponseCache: LRUCache<string, providers.TransactionResponse>;
  private blockTimestampCache: LRUCache<number, number>;
  private readonly MAX_TRIES: number; // Retries counter

  constructor(provider: providers.Provider, apiKeys: ApiKeys) {
    this.apiKeys = apiKeys;
    this.provider = provider;
    this.alchemy = new Alchemy({
      apiKey: this.apiKeys.apiKeys.victimLoss.alchemyApiKey,
      network: Network.ETH_MAINNET,
    });
    this.ethPriceCache = new LRUCache<number, number>({
      max: 1000,
    });
    this.floorPriceCache = new LRUCache<string, number>({
      max: 10000,
    });
    this.erc20PriceCache = new LRUCache<string, number>({
      max: 10000,
    });
    this.txReceiptCache = new LRUCache<string, providers.TransactionReceipt>({
      max: 1000,
    });
    this.txResponseCache = new LRUCache<string, providers.TransactionResponse>({
      max: 1000,
    });
    this.blockTimestampCache = new LRUCache<number, number>({
      max: 1000,
    });
    this.MAX_TRIES = 3;
  }

  private getBlockExplorerKey = (chainId: number) => {
    const blockExplorerKeys = this.apiKeys.apiKeys.victimLoss;

    switch (chainId) {
      case 10:
        return blockExplorerKeys.optimisticEtherscanApiKeys.length > 0
          ? blockExplorerKeys.optimisticEtherscanApiKeys[
              Math.floor(Math.random() * blockExplorerKeys.optimisticEtherscanApiKeys.length)
            ]
          : "YourApiKeyToken";
      case 56:
        return blockExplorerKeys.bscscanApiKeys.length > 0
          ? blockExplorerKeys.bscscanApiKeys[Math.floor(Math.random() * blockExplorerKeys.bscscanApiKeys.length)]
          : "YourApiKeyToken";
      case 137:
        return blockExplorerKeys.polygonscanApiKeys.length > 0
          ? blockExplorerKeys.polygonscanApiKeys[
              Math.floor(Math.random() * blockExplorerKeys.polygonscanApiKeys.length)
            ]
          : "YourApiKeyToken";
      case 250:
        return blockExplorerKeys.fantomscanApiKeys.length > 0
          ? blockExplorerKeys.fantomscanApiKeys[Math.floor(Math.random() * blockExplorerKeys.fantomscanApiKeys.length)]
          : "YourApiKeyToken";
      case 42161:
        return blockExplorerKeys.arbiscanApiKeys.length > 0
          ? blockExplorerKeys.arbiscanApiKeys[Math.floor(Math.random() * blockExplorerKeys.arbiscanApiKeys.length)]
          : "YourApiKeyToken";
      case 43114:
        return blockExplorerKeys.snowtraceApiKeys.length > 0
          ? blockExplorerKeys.snowtraceApiKeys[Math.floor(Math.random() * blockExplorerKeys.snowtraceApiKeys.length)]
          : "YourApiKeyToken";
      default:
        return blockExplorerKeys.etherscanApiKeys.length > 0
          ? blockExplorerKeys.etherscanApiKeys[Math.floor(Math.random() * blockExplorerKeys.etherscanApiKeys.length)]
          : "YourApiKeyToken";
    }
  };

  getERC20TransfersUrl = (address: string, blockNumber: number, chainId: number) => {
    const { tokenTx } = etherscanApis[chainId];
    const key = this.getBlockExplorerKey(chainId);
    return `${tokenTx}&address=${address}&fromBlock=0&toBlock=${blockNumber}&page=1&offset=9999&apikey=${key}`;
  };

  getERC721TransfersUrl = (address: string, blockNumber: number, chainId: number) => {
    const { nftTx } = etherscanApis[chainId];
    const key = this.getBlockExplorerKey(chainId);
    return `${nftTx}&address=${address}&fromBlock=0&toBlock=${blockNumber}&page=1&offset=9999&apikey=${key}`;
  };

  private getTimestamp = async (blockNumber: number) => {
    if (this.blockTimestampCache.has(blockNumber)) {
      return this.blockTimestampCache.get(blockNumber);
    }

    let tries = 0;

    while (tries < this.MAX_TRIES) {
      try {
        const block = await this.provider.getBlock(blockNumber);
        const timestamp = block.timestamp;
        this.blockTimestampCache.set(blockNumber, timestamp);
        return timestamp;
      } catch (err) {
        tries++;
        if (tries === this.MAX_TRIES) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }
  };

  getTransactionReceipt = async (txHash: string) => {
    if (this.txReceiptCache.has(txHash)) {
      return this.txReceiptCache.get(txHash);
    }

    let receipt;
    let tries = 0;

    while (tries < this.MAX_TRIES) {
      try {
        receipt = (await this.provider.getTransactionReceipt(txHash)) as providers.TransactionReceipt;
        this.txReceiptCache.set(txHash, receipt);
        break; // exit the loop if successful
      } catch (err) {
        tries++;
        if (tries === this.MAX_TRIES) {
          throw err; // throw the error if maximum tries reached
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }
    return receipt;
  };

  getTransaction = async (txHash: string) => {
    if (this.txResponseCache.has(txHash)) {
      return this.txResponseCache.get(txHash);
    }

    let receipt;
    let tries = 0;

    while (tries < this.MAX_TRIES) {
      try {
        receipt = (await this.provider.getTransaction(txHash)) as providers.TransactionResponse;
        this.txResponseCache.set(txHash, receipt);
        break; // exit the loop if successful
      } catch (err) {
        tries++;
        if (tries === this.MAX_TRIES) {
          throw err; // throw the error if maximum tries reached
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }
    return receipt;
  };

  getErc20Price = async (tokenAddress: string, blockNumber: number): Promise<number | undefined> => {
    const timestamp = await this.getTimestamp(blockNumber);

    const key = `${tokenAddress}-${timestamp}`;
    if (this.erc20PriceCache.has(key)) {
      return this.erc20PriceCache.get(key);
    }

    let tries = 0;

    while (tries < this.MAX_TRIES) {
      try {
        const url = `https://coins.llama.fi/prices/historical/${timestamp}/ethereum:${tokenAddress}`;
        const response = await fetch(url);
        const data = (await response.json()) as CoinData;
        const price = data.coins[`ethereum:${tokenAddress}`]?.price;

        if (price == null) {
          tries++; // Increment tries counter for null price
          console.log(`Fetched price for token ${tokenAddress} is null (attempt ${tries})`);
        } else {
          this.erc20PriceCache.set(key, price);
          return price;
        }
      } catch (e) {
        tries++;
        console.log(`Error in fetching ETH price (attempt ${tries}): `, e);
        if (tries === this.MAX_TRIES) {
          throw e;
        }
      }
      // Wait for 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return undefined;
  };

  getNativeTokenPrice = async (timestamp: number): Promise<number | undefined> => {
    if (this.ethPriceCache.has(timestamp)) {
      const price = this.ethPriceCache.get(timestamp);
      console.log(`Using cached ETH price for timestamp: ${timestamp}. Price is: ${price}.`);
      return this.ethPriceCache.get(timestamp);
    }

    let tries = 0;

    while (tries < this.MAX_TRIES) {
      try {
        const url = `https://coins.llama.fi/prices/historical/${timestamp}/coingecko:ethereum`;
        const response = await fetch(url);
        const data = (await response.json()) as CoinData;
        const price = data.coins["coingecko:ethereum"]?.price;

        if (price == null) {
          tries++; // Increment tries counter for null price
          console.log(`Fetched ETH price is null (attempt ${tries})`);
        } else {
          this.ethPriceCache.set(timestamp, price);
          return price;
        }
      } catch (e) {
        tries++;
        console.log(`Error in fetching ETH price (attempt ${tries}): `, e);
        if (tries === this.MAX_TRIES) {
          throw e;
        }
      }

      // Wait for 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return undefined;
  };

  getFloorPriceInEth = async (nftAddress: string): Promise<number> => {
    let tries = 0;

    while (tries < this.MAX_TRIES) {
      try {
        const floorPrice: GetFloorPriceResponse = await this.alchemy.nft.getFloorPrice(nftAddress);

        const previousEntry = Object.values(floorPrice).reduce((previous: FloorPriceMarketplace | null, current) => {
          if ("error" in current) {
            return previous;
          }

          if (!previous || new Date(current.retrievedAt) > new Date(previous.retrievedAt)) {
            return current;
          }
          return previous;
        });

        if (previousEntry && previousEntry.priceCurrency !== "ETH") {
          return 0;
        }

        return previousEntry ? previousEntry.floorPrice : 0;
      } catch (e) {
        tries++;
        console.error(`Error fetching floor price (attempt ${tries}): `, e);
        if (tries === this.MAX_TRIES) {
          throw e;
        }

        // Wait for 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return 0;
  };

  getNftCollectionFloorPrice = async (nftAddress: string, blockNumber: number): Promise<number> => {
    const key = `${nftAddress}-${blockNumber}`;
    if (this.floorPriceCache.has(key)) {
      return this.floorPriceCache.get(key)!;
    }

    const timestamp = await this.getTimestamp(blockNumber);

    const ethPriceInUsd = await this.getNativeTokenPrice(timestamp!);
    const floorPriceInEth = await this.getFloorPriceInEth(nftAddress);

    if (!ethPriceInUsd || !floorPriceInEth) {
      return 0;
    }

    const floorPriceInUsd = floorPriceInEth * ethPriceInUsd;
    this.floorPriceCache.set(key, floorPriceInUsd);
    return floorPriceInUsd;
  };

  getScammerErc721Transfers = async (
    scammerAddress: string,
    transferOccuranceTimeWindowInDays: number
  ): Promise<Erc721Transfer[]> => {
    let erc721Transfers: Erc721Transfer[] = [];

    const currentTime = new Date();
    const oneDayInMs = ONE_DAY_IN_SECS * 1000;
    const daysTimeWindowInMs = transferOccuranceTimeWindowInDays * oneDayInMs;

    const maxTimestamp = currentTime.toISOString();
    const minTimestamp = new Date(currentTime.getTime() - daysTimeWindowInMs).toISOString();

    const query = `
      query GetErc721Transfers($scammerAddress: String!, $minTimestamp: String!, $maxTimestamp: String!) {
        records(
          filter: {
            block_time: {
              min: $minTimestamp,
              max: $maxTimestamp
            },
          },
          to_address: $scammerAddress
        ) {
          transaction_hash
          contract_address
          from_address
          to_address
          token_id
          symbol
          name
          block_time
        }
      }
    `;

    const variables = {
      scammerAddress,
      minTimestamp,
      maxTimestamp,
    };

    const body = JSON.stringify({
      query,
      variables,
    });

    let tries = 0;

    while (tries < this.MAX_TRIES) {
      try {
        const response = await fetch(
          "https://api.zettablock.com/api/v1/dataset/sq_8b63dd1011c54ac8a1af53542a96f583/graphql",
          {
            method: "POST",
            body,
            headers: {
              accept: "application/json",
              "X-API-KEY": this.apiKeys.generalApiKeys.ZETTABLOCK[0],
              "content-type": "application/json",
            },
          }
        );
        const data = await response.json();
        erc721Transfers = data.data.records;
        break; // exit the loop if successful
      } catch (err) {
        tries++;
        if (tries === this.MAX_TRIES) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }

    return erc721Transfers;
  };

  hasBuyerTransferredTokenToSeller = async (
    buyerAddress: string,
    sellerAddresses: string[],
    chainId: number,
    blockNumber: number
  ) => {
    const fetchWithRetry = async (url: string) => {
      let tries = 0;
      while (tries < this.MAX_TRIES) {
        try {
          const response = await fetch(url);
          const data = await response.json();

          if (data.message.startsWith("NOTOK") || data.message.startsWith("Query Timeout")) {
            tries++;
            console.log(`block explorer error occured (attempt ${tries})`);
            if (tries === this.MAX_TRIES) {
              console.log(`block explorer error occured (final attempt); skipping check.`);
              return [];
            }
          } else {
            return data.result;
          }
        } catch (e) {
          tries++;
          console.log(`Error in fetching data (attempt ${tries}): `, e);
          if (tries === this.MAX_TRIES) {
            throw e;
          }
        }
        // Wait for 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    };

    const erc20Url = this.getERC20TransfersUrl(buyerAddress, blockNumber, chainId);
    const erc721Url = this.getERC721TransfersUrl(buyerAddress, blockNumber, chainId);

    const erc20Transfers = (await fetchWithRetry(erc20Url)) as EtherscanApiResponse[];
    const erc721Transfers = (await fetchWithRetry(erc721Url)) as EtherscanApiResponse[];

    for (const transfer of erc20Transfers) {
      if (transfer.from === buyerAddress && sellerAddresses.includes(transfer.to)) {
        const price = await this.getErc20Price(transfer.contractAddress, blockNumber);
        if (price && price > FP_BUYER_TO_SELLER_MIN_TRANSFERRED_TOKEN_VALUE) {
          return true;
        }
      }
    }

    for (const transfer of erc721Transfers) {
      if (transfer.from === buyerAddress && sellerAddresses.includes(transfer.to)) {
        const price = await this.getNftCollectionFloorPrice(transfer.contractAddress, blockNumber);
        if (price > FP_BUYER_TO_SELLER_MIN_TRANSFERRED_TOKEN_VALUE) {
          return true;
        }
      }
    }

    return false;
  };
}
