import { providers } from "ethers";
import {
  Network,
  Alchemy,
  GetFloorPriceResponse,
  FloorPriceMarketplace,
} from "alchemy-sdk";
import { LRUCache } from "lru-cache";
import { apiKeys, Erc721Transfer, coinData } from "./types";

export default class DataFetcher {
  provider: providers.Provider;
  private apiKeys: apiKeys;
  alchemy: Alchemy;
  private ethPriceCache: LRUCache<number, number>;
  private floorPriceCache: LRUCache<string, number>;
  private txReceiptCache: LRUCache<string, providers.TransactionReceipt>;
  private txResponseCache: LRUCache<string, providers.TransactionResponse>;
  private blockTimestampCache: LRUCache<number, number>;
  private readonly MAX_TRIES: number; // Retries counter

  constructor(provider: providers.Provider, apiKeys: apiKeys) {
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
        receipt = (await this.provider.getTransactionReceipt(
          txHash
        )) as providers.TransactionReceipt;
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
        receipt = (await this.provider.getTransaction(
          txHash
        )) as providers.TransactionResponse;
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

  getNativeTokenPrice = async (
    timestamp: number
  ): Promise<number | undefined> => {
    if (this.ethPriceCache.has(timestamp)) {
      const price = this.ethPriceCache.get(timestamp);
      console.log(
        `Using cached ETH price for timestamp: ${timestamp}. Price is: ${price}.`
      );
      return this.ethPriceCache.get(timestamp);
    }

    let tries = 0;

    while (tries < this.MAX_TRIES) {
      try {
        const url = `https://coins.llama.fi/prices/historical/${timestamp}/coingecko:ethereum`;
        const response = await fetch(url);
        const data = (await response.json()) as coinData;
        const price = data.coins["coingecko:ethereum"]?.price;

        if (price == null) {
          tries++; // Increment tries counter for null price
          console.log(`Fetched price is null (attempt ${tries})`);
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
        const floorPrice: GetFloorPriceResponse =
          await this.alchemy.nft.getFloorPrice(nftAddress);

        const latestEntry = Object.values(floorPrice).reduce(
          (latest: FloorPriceMarketplace | null, current) => {
            if ("error" in current) {
              return latest;
            }

            if (
              !latest ||
              new Date(current.retrievedAt) > new Date(latest.retrievedAt)
            ) {
              return current;
            }
            return latest;
          },
          {
            floorPrice: 0,
            priceCurrency: "",
            collectionUrl: "",
            retrievedAt: "2000-01-01T00:00:00.000Z",
          }
        );

        if (latestEntry.priceCurrency !== "ETH") {
          return 0;
        }

        return latestEntry.floorPrice;
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

  getNftCollectionFloorPrice = async (
    nftAddress: string,
    blockNumber: number
  ): Promise<number> => {
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
    transferOccuranceTimeWindow: number
  ): Promise<Erc721Transfer[]> => {
    let erc721Transfers: Erc721Transfer[] = [];

    const currentTime = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const timeWindowInMs = transferOccuranceTimeWindow * oneDayInMs;

    const maxTimestamp = currentTime.toISOString();
    const minTimestamp = new Date(
      currentTime.getTime() - timeWindowInMs
    ).toISOString();

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
}