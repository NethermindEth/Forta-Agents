import { providers, Contract, BigNumber, ethers } from "ethers";
import LRU from "lru-cache";
import { Interface } from "ethers/lib/utils";
import fetch from "node-fetch";
import Moralis from "moralis";
import { MAX_USD_VALUE, TOKEN_ABI } from "./utils";
import { CONTRACT_TRANSACTION_COUNT_THRESHOLD, etherscanApis } from "./config";

export type ApiKeys = {
  generalApiKeys: {
    MORALIS: string;
  };
  apiKeys: {
    largeProfit: {
      ethplorerApiKeys: string[];
      chainbaseApiKeys: string[];
      moralisApiKeys: string[];
      etherscanApiKeys: string[];
      optimisticEtherscanApiKeys: string[];
      bscscanApiKeys: string[];
      polygonscanApiKeys: string[];
      fantomscanApiKeys: string[];
      arbiscanApiKeys: string[];
      snowtraceApiKeys: string[];
    };
  };
};

type TokenPriceCacheEntry = {
  timestamp: number; // Timestamp when the cache entry was created
  value: number; // Cached value (USD price)
};

export default class Fetcher {
  provider: providers.JsonRpcProvider;
  private cache: LRU<string, BigNumber | number | boolean | { contractCreator: string; creationTxHash: string }>;
  private tokenContract: Contract;
  private tokensPriceCache: LRU<string, TokenPriceCacheEntry>;
  private priceCacheExpirationTime: number;
  private apiKeys: ApiKeys;
  private maxRetries: number;

  constructor(provider: ethers.providers.JsonRpcProvider, apiKeys: ApiKeys) {
    this.apiKeys = apiKeys;
    this.provider = provider;
    this.tokenContract = new Contract("", new Interface(TOKEN_ABI), this.provider);
    this.cache = new LRU<string, BigNumber | number | boolean | { contractCreator: string; creationTxHash: string }>({
      max: 10000,
    });
    this.tokensPriceCache = new LRU<string, TokenPriceCacheEntry>({ max: 20000 });
    this.priceCacheExpirationTime = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    this.maxRetries = 2;
    (async () => {
      await Moralis.start({
        apiKey: this.getKey(),
      });
    })();
  }

  private getKey = () => {
    const keys = this.apiKeys.apiKeys.largeProfit.moralisApiKeys;
    return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : "YourApiKeyToken";
  };

  public async getTotalSupply(block: number, tokenAddress: string, retries: number): Promise<BigNumber> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `totalSupply-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    let totalSupply;

    for (let i = 0; i < retries; i++) {
      try {
        totalSupply = await token.totalSupply({
          blockTag: block,
        });
        break;
      } catch (err: unknown) {
        if (i === retries - 1) {
          totalSupply = ethers.constants.MaxUint256;
          break;
        }

        console.log(`Retrying in 1 second...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    this.cache.set(key, totalSupply);

    return totalSupply;
  }

  public async getDecimals(block: number | string, tokenAddress: string): Promise<number> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `decimals-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as number;

    let decimals: number = 0;

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        decimals = await token.decimals({
          blockTag: block,
        });
        break;
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.log(`Error fetching decimals for token ${tokenAddress}`);
        } else {
          console.log(`Unknown error when fetching total supply: ${err}`);
        }
        if (i === this.maxRetries - 1) {
          decimals = 18;
          console.log(`Failed to fetch decimals for ${tokenAddress} after retries, using default max value: 18`);
          break;
        }

        console.log(`Retrying in 1 second...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    this.cache.set(key, decimals);

    return decimals;
  }

  private getUniswapPrice = async (chainId: number, block: number, token: string) => {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const response = await Moralis.EvmApi.token.getTokenPrice({
          chain: chainId,
          toBlock: block - 1,
          address: token,
        });

        if (response.raw.usdPrice && response.raw.tokenAddress?.toLowerCase() === token.toLowerCase()) {
          return response.raw.usdPrice;
        } else {
          return 0;
        }
      } catch (e) {
        return 0;
      }
    }
  };

  private getTokenPriceUrl = (chain: string, token: string) => {
    return `https://coins.llama.fi/prices/current/${chain}:${token}`;
  };

  private getChainByChainId = (chainId: number) => {
    switch (Number(chainId)) {
      case 10:
        return "optimism";
      case 56:
        return "bsc";
      case 137:
        return "polygon";
      case 250:
        return "fantom";
      case 42161:
        return "arbitrum";
      case 43114:
        return "avax";
      default:
        return "ethereum";
    }
  };

  private getNativeTokenByChainId = (chainId: number) => {
    switch (Number(chainId)) {
      case 10:
        return "ethereum";
      case 56:
        return "binancecoin";
      case 137:
        return "matic-network";
      case 250:
        return "fantom";
      case 42161:
        return "ethereum";
      case 43114:
        return "avalanche-2";
      default:
        return "ethereum";
    }
  };

  private getNativeTokenPrice = (chain: string) => {
    return `https://api.coingecko.com/api/v3/simple/price?ids=${chain}&vs_currencies=usd`;
  };

  private getEtherscanContractUrl = (address: string, chainId: number) => {
    const { urlContract } = etherscanApis[chainId];
    const key = this.getBlockExplorerKey(chainId);
    return `${urlContract}&address=${address}&apikey=${key}`;
  };

  // Fetches transactions in descending order (newest first)
  private getEtherscanAddressUrl = (address: string, blockNumber: number, chainId: number) => {
    const { urlAccount } = etherscanApis[chainId];
    const key = this.getBlockExplorerKey(chainId);
    return `${urlAccount}&address=${address}&startblock=0&endblock=${blockNumber - 1}&sort=desc&apikey=${key}`;
  };

  private getEthplorerTopTokenHoldersUrl = (tokenAddress: string, key: string) => {
    return `https://api.ethplorer.io/getTopTokenHolders/${tokenAddress}?apiKey=${key}&limit=1000`;
  };

  private getChainBaseTopTokenHoldersUrl = (tokenAddress: string, chainId: number) => {
    return `https://api.chainbase.online/v1/token/holders?chain_id=${chainId}&contract_address=${tokenAddress}&page=1&limit=100`;
  };

  private getBlockExplorerKey = (chainId: number) => {
    const getKey = (keys: string[]) =>
      keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : "YourApiKeyToken";

    switch (chainId) {
      case 10:
        return getKey(this.apiKeys.apiKeys.largeProfit.optimisticEtherscanApiKeys);
      case 56:
        return getKey(this.apiKeys.apiKeys.largeProfit.bscscanApiKeys);
      case 137:
        return getKey(this.apiKeys.apiKeys.largeProfit.polygonscanApiKeys);
      case 250:
        return getKey(this.apiKeys.apiKeys.largeProfit.fantomscanApiKeys);
      case 42161:
        return getKey(this.apiKeys.apiKeys.largeProfit.arbiscanApiKeys);
      case 43114:
        return getKey(this.apiKeys.apiKeys.largeProfit.snowtraceApiKeys);
      default:
        return getKey(this.apiKeys.apiKeys.largeProfit.etherscanApiKeys);
    }
  };

  public isContractVerified = async (address: string, chainId: number) => {
    const key: string = `isContractVerified-${address}-${chainId}`;
    if (this.cache.has(key)) return this.cache.get(key) as boolean;

    try {
      const result = await (await fetch(this.getEtherscanContractUrl(address, chainId))).json();

      if (result.message.startsWith("NOTOK") && result.result !== "Contract source code not verified") {
        console.log(`block explorer error occured; skipping check for ${address}`);
        return null;
      }
      const isVerified = result.status === "1";

      if (isVerified) {
        this.cache.set(key, isVerified);
      }

      return isVerified;
    } catch (error) {
      console.error(`Error verifying contract ${address}: `, error);
      return true;
    }
  };

  public getContractInfo = async (contract: string, txFrom: string, blockNumber: number, chainId: number) => {
    try {
      const result = await (await fetch(this.getEtherscanAddressUrl(contract, blockNumber, chainId))).json();

      if (result.message.startsWith("NOTOK") || result.message.startsWith("Query Timeout")) {
        console.log(`block explorer error occured; skipping check for ${contract}`);
        return [null, null];
      }

      const numberOfInteractions = result.result.filter(
        (tx: any) => tx.from === txFrom && Number(tx.blockNumber) < blockNumber
      ).length;
      let isFirstInteraction = numberOfInteractions === 0;
      const hasHighNumberOfTotalTxs = result.result.length > CONTRACT_TRANSACTION_COUNT_THRESHOLD;

      // If the max tx limit returned by the block explorer is reached and it's the first interaction,
      // check the past transactions of the initiator
      if (isFirstInteraction && result.result.length == 10000) {
        try {
          const initiatorResult = await (await fetch(this.getEtherscanAddressUrl(txFrom, blockNumber, chainId))).json();
          if (initiatorResult.message.startsWith("NOTOK") || initiatorResult.message.startsWith("Query Timeout")) {
            console.log(`block explorer error occured; skipping check for ${contract}`);
            return [null, null];
          }

          const initiatorInteractions = initiatorResult.result.filter(
            (tx: any) => tx.to === contract && Number(tx.blockNumber) < blockNumber
          ).length;
          isFirstInteraction = initiatorInteractions === 0;
        } catch (error) {
          console.error(`Error getting contract info ${contract}: `, error);
          return [false, true];
        }
      }

      return [isFirstInteraction, hasHighNumberOfTotalTxs];
    } catch (error) {
      console.error(`Error getting contract info ${contract}: `, error);
      return [false, true];
    }
  };

  public getContractCreationInfo = async (
    addresses: string | string[],
    chainId: number
  ): Promise<{ contractCreator: string | null; creationTxHash: string | null }[]> => {
    const addressesArray = Array.isArray(addresses) ? addresses : [addresses];
    const results: { contractCreator: string | null; creationTxHash: string | null }[] = [];

    // Split addresses into batches of 5
    const addressBatches = [];
    for (let i = 0; i < addressesArray.length; i += 5) {
      addressBatches.push(addressesArray.slice(i, i + 5));
    }

    for (const batch of addressBatches) {
      const uncachedAddresses = batch.filter((address) => {
        const cacheKey: string = `contractCreator-${address}-${chainId}`;
        if (this.cache.has(cacheKey)) {
          results.push(this.cache.get(cacheKey) as { contractCreator: string; creationTxHash: string });
          return false;
        }
        return true;
      });

      if (uncachedAddresses.length === 0) {
        continue;
      }

      const { urlContractCreation } = etherscanApis[chainId];
      const key = this.getBlockExplorerKey(chainId);
      const url = `${urlContractCreation}&contractaddresses=${uncachedAddresses.join(",")}&apikey=${key}`;
      try {
        const result = await (await fetch(url)).json();

        if (
          result.message.startsWith("NOTOK") ||
          result.message.startsWith("No data") ||
          result.message.startsWith("Query Timeout") ||
          result.message.startsWith("You are reaching the maximum number of requests") ||
          !result.result
        ) {
          uncachedAddresses.forEach((address) => {
            results.push({ contractCreator: null, creationTxHash: null });
          });
        } else {
          result.result.forEach((contractInfo: any) => {
            const address = contractInfo.contractAddress;
            const cacheKey: string = `contractCreator-${address}-${chainId}`;
            const contractData = {
              contractCreator: contractInfo.contractCreator,
              creationTxHash: contractInfo.txHash,
            };
            this.cache.set(cacheKey, contractData);
            results.push(contractData);
          });
        }
      } catch (error) {
        console.error(`Error during fetch for batch ${uncachedAddresses.join(",")}:`, error);
        uncachedAddresses.forEach((address) => {
          results.push({ contractCreator: null, creationTxHash: null });
        });
      }
    }

    return results;
  };

  public isContractCreatedByInitiator = async (
    contracts: string | string[],
    initiator: string,
    blockNumber: number,
    chainId: number
  ): Promise<{ [contract: string]: boolean | undefined }> => {
    const contractCreationInfos = await this.getContractCreationInfo(contracts, chainId);
    const initiatorTxResult = await this.getInitiatorTransactionData(initiator, blockNumber, chainId);
    const contractArray = Array.isArray(contracts) ? contracts : [contracts];

    return contractArray.reduce((results, contract, i) => {
      const { contractCreator } = contractCreationInfos[i];

      if (!contractCreator) {
        results[contract] = undefined;
      } else if (contractCreator.toLowerCase() === initiator.toLowerCase()) {
        results[contract] = true;
      } else {
        results[contract] = initiatorTxResult.result.some(
          (tx: any) =>
            [contractCreator.toLowerCase(), initiator.toLowerCase()].includes(tx.from) &&
            [contractCreator.toLowerCase(), initiator.toLowerCase()].includes(tx.to) &&
            tx.to !== tx.from &&
            Number(tx.blockNumber) < blockNumber
        );
      }

      return results;
    }, {} as { [contract: string]: boolean | undefined });
  };

  private getInitiatorTransactionData = async (initiator: string, blockNumber: number, chainId: number) => {
    try {
      return await (await fetch(this.getEtherscanAddressUrl(initiator, blockNumber, chainId))).json();
    } catch (error) {
      console.error(`Error fetching transaction data for initiator ${initiator}:`, error);
      return { message: "An error occurred", result: [] };
    }
  };

  public async getValueInUsd(block: number, chainId: number, amount: string, token: string): Promise<number> {
    let response, usdPrice;
    let foundInCache = false;
    const key = `usdPrice-${token}`;

    if (this.tokensPriceCache.has(key)) {
      const cacheEntry = this.tokensPriceCache.get(key)!;

      if (cacheEntry.timestamp + this.priceCacheExpirationTime > Date.now()) {
        usdPrice = cacheEntry.value;
        foundInCache = true;
      } else {
        // Cache entry has expired, remove it from the cache
        this.tokensPriceCache.delete(key);
      }
    }

    if (!foundInCache) {
      if (token === "native") {
        const chain = this.getNativeTokenByChainId(chainId);

        let retries = 3;
        while (retries > 0) {
          try {
            response = (await (await fetch(this.getNativeTokenPrice(chain))).json()) as any;
            break;
          } catch {
            retries--;
          }
        }
        if (!response || !response[chain]) {
          return 0;
        } else {
          usdPrice = response[chain].usd;
        }
      } else {
        const chain = this.getChainByChainId(chainId);
        for (let i = 0; i < this.maxRetries; i++) {
          try {
            response = (await (await fetch(this.getTokenPriceUrl(chain, token))).json()) as any;

            if (
              response &&
              response["coins"][`${chain}:${token}`] &&
              response["coins"][`${chain}:${token}`]["confidence"] > 0.7
            ) {
              usdPrice = response["coins"][`${chain}:${token}`]["price"];
              break;
            } else {
              throw new Error("Error: Can't fetch USD price on CoinGecko");
            }
          } catch {
            if (!response) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            } else {
              break;
            }
          }
        }
        if (!usdPrice) {
          // Moralis API is not available on Optimism
          if (chainId === 10) {
            return 0;
          }
          usdPrice = await this.getUniswapPrice(chainId, block, token);
          if (!usdPrice) {
            const newCacheEntry = {
              timestamp: Date.now(),
              value: 0,
            };
            this.tokensPriceCache.set(key, newCacheEntry);
            console.log("Setting 0 as the price of token:", token);
            return 0;
          }
        }
      }

      const newCacheEntry = {
        timestamp: Date.now(),
        value: usdPrice,
      };
      this.tokensPriceCache.set(key, newCacheEntry);
    }

    let tokenAmount;
    if (token === "native") {
      tokenAmount = ethers.utils.formatEther(amount);
    } else {
      const decimals = await this.getDecimals(block, token);
      tokenAmount = ethers.utils.formatUnits(amount, decimals);
    }
    return Number(tokenAmount) * usdPrice;
  }

  public getCLandAS = (value: number, method: string) => {
    // "value" is either the USD value or the percentage of total supply
    if (method === "usdValue") {
      /*
          Calculate Confidence Level based on USD value.
          If the value is MAX_USD_VALUE or more, the Confidence Level is 1.
          Otherwise, the Confidence Level is calculated by:
           - Dividing the value by the maximum value (MAX_USD_VALUE)
           - Dividing the result by 10, which splits the range into 10 parts
           - Rounding the result to the nearest tenth
           - Dividing the result by 10, which scales the value down by a factor of 10 (range 0-1)
          The resulting Confidence Level will be a number between 0 and 1, with 0.1 increments (e.g. 0.1, 0.2, 0.3, etc.)
        */
      const level = Math.round(value / (MAX_USD_VALUE / 10)) / 10;
      const CL = Math.min(1, level);
      const anomalyScore = CL === 1 ? 0.0001 : 1 - CL;
      return [CL, anomalyScore];
    } else if (method === "totalSupply") {
      if (value >= 30) {
        return [1, 0.0001];
      } else if (value >= 20) {
        return [0.9, 0.1];
      } else if (value >= 10) {
        return [0.8, 0.2];
      } else if (value >= 5) {
        return [0.7, 0.3];
      }
    }
  };

  public async hasHighNumberOfHolders(chainId: number, token: string): Promise<boolean> {
    let response;
    // Fantom is not supported by Chainbase
    // For Ethereum we use Ethplorer
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        if (![1, 250].includes(chainId)) {
          response = await (
            await fetch(this.getChainBaseTopTokenHoldersUrl(token, chainId), {
              method: "GET",
              headers: {
                "x-api-key": this.apiKeys.apiKeys.largeProfit.chainbaseApiKeys[0],
                accept: "application/json",
              },
            })
          ).json();
          return Boolean(response.next_page as number);
        } else if (chainId === 1) {
          response = (await (
            await fetch(
              this.getEthplorerTopTokenHoldersUrl(token, this.apiKeys.apiKeys.largeProfit.ethplorerApiKeys[0])
            )
          ).json()) as any;
          return response.holders.length >= 100;
        } else {
          // Fantom is unsupported
          return false;
        }
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return false;
  }
}
