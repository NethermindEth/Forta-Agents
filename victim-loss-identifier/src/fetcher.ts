import { providers } from "ethers";
import { apiKeys, Erc721Transfer, coinData } from "./types";
import { Network, Alchemy, GetFloorPriceResponse, FloorPriceMarketplace } from "alchemy-sdk";
import { LRUCache } from "lru-cache";

export default class DataFetcher {
  provider: providers.Provider;
  private apiKeys: apiKeys;
  private alchemy: Alchemy;
  private ethPriceCache: LRUCache<number, number>;
  private floorPriceCache: LRUCache<number, number>;

  constructor(provider: providers.Provider, apiKeys: apiKeys) {
    this.apiKeys = apiKeys;
    this.provider = provider;
    this.alchemy = new Alchemy({
      apiKey: this.apiKeys.victimLossKeys.alchemyApiKey,
      network: Network.ETH_MAINNET,
    });
    this.ethPriceCache = new LRUCache<number, number>({
      max: 1000,
    });
    this.floorPriceCache = new LRUCache<number, number>({
      max: 10000,
    });
  }

  getTransactionReceipt = async (txHash: string) => {
    let receipt;
    let tries = 0;
    const maxTries = 3;

    while (tries < maxTries) {
      try {
        receipt = await this.provider.getTransactionReceipt(txHash);
        break; // exit the loop if successful
      } catch (err) {
        tries++;
        if (tries === maxTries) {
          throw err; // throw the error if maximum tries reached
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }
    return receipt;
  };

  getTransaction = async (txHash: string) => {
    let receipt;
    let tries = 0;
    const maxTries = 3;

    while (tries < maxTries) {
      try {
        receipt = await this.provider.getTransaction(txHash);
        break; // exit the loop if successful
      } catch (err) {
        tries++;
        if (tries === maxTries) {
          throw err; // throw the error if maximum tries reached
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }
    return receipt;
  };

  private getNativeTokenPrice = async (timestamp: number): Promise<number | undefined> => {
    if (this.ethPriceCache.has(timestamp)) {
      console.log(`Using cached ETH price for timestamp: ${timestamp}`);
      return this.ethPriceCache.get(timestamp);
    }

    const maxTries = 3;
    let tries = 0;

    while (tries < maxTries) {
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
        console.log(`Error in fetching ETH price (attempt ${tries}):`, e);
        if (tries === maxTries) {
          throw e;
        }
      }

      // Wait for 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return undefined;
  };

  private getFloorPriceInEth = async (nftAddress: string): Promise<number> => {
    const maxTries = 3;
    let tries = 0;

    while (tries < maxTries) {
      try {
        const floorPrice: GetFloorPriceResponse = await this.alchemy.nft.getFloorPrice(nftAddress);

        const latestEntry = Object.values(floorPrice).reduce(
          (latest: FloorPriceMarketplace | null, current) => {
            if ("error" in current) {
              return latest;
            }

            if (!latest || new Date(current.retrievedAt) > new Date(latest.retrievedAt)) {
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
        console.error(`Error fetching floor price (attempt ${tries}):`, e);
        if (tries === maxTries) {
          throw e;
        }

        // Wait for 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return 0;
  };

  getNftCollectionFloorPrice = async (nftAddress: string, timestamp: number): Promise<number> => {
    if (this.floorPriceCache.has(timestamp)) {
      return this.floorPriceCache.get(timestamp)!;
    }

    const ethPrice = await this.getNativeTokenPrice(timestamp);
    const floorPriceInEth = await this.getFloorPriceInEth(nftAddress);

    if (!ethPrice || !floorPriceInEth) {
      return 0;
    }

    const floorPrice = floorPriceInEth * ethPrice;
    this.floorPriceCache.set(timestamp, floorPrice);
    return floorPrice;
  };

  getErc721TransfersInvolvingScammer = async (
    scammerAddress: string,
    transferOccuranceTimeWindow: number
  ): Promise<Erc721Transfer[]> => {
    let erc721Transfers: Erc721Transfer[] = [];

    const currentTime = new Date();
    const timeWindowInMs = transferOccuranceTimeWindow * 24 * 60 * 60 * 1000;

    const maxTimestamp = currentTime.toISOString();
    const minTimestamp = new Date(currentTime.getTime() - timeWindowInMs).toISOString();

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
    const maxTries = 3;

    while (tries < maxTries) {
      try {
        const response = await fetch(
          "https://api.zettablock.com/api/v1/dataset/sq_8b63dd1011c54ac8a1af53542a96f583/graphql",
          {
            method: "POST",
            body,
            headers: {
              accept: "application/json",
              "X-API-KEY": `${this.apiKeys["generalApiKeys"]["ZETTABLOCK"][0]}`,
              "content-type": "application/json",
            },
          }
        );
        const data = await response.json();
        erc721Transfers = data.data.records;
        break; // exit the loop if successful
      } catch (err) {
        tries++;
        if (tries === maxTries) {
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second before retrying
      }
    }

    return erc721Transfers;
  };
}
