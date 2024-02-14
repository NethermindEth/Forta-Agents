import { providers, ethers } from "ethers";
import LRU from "lru-cache";
import fetch from "node-fetch";

export const EOA_TRANSACTION_COUNT_THRESHOLD = 1000;
export const CONTRACT_TRANSACTION_COUNT_THRESHOLD = 10000;

interface etherscanApisInterface {
  [key: number]: {
    urlAccount: string;
  };
}

export const etherscanApis: etherscanApisInterface = {
  1: {
    urlAccount: "https://api.etherscan.io/api?module=account&action=txlist",
  },
  250: {
    urlAccount: "https://api.ftmscan.com/api?module=account&action=txlist",
  },
};

export type ApiKeys = {
  apiKeys: {
    reentrancy: { etherscanApiKeys: string[]; fantomscanApiKeys: string[] };
  };
};

export default class Fetcher {
  provider: providers.Provider;
  private cache: LRU<string, boolean>;
  private apiKeys: ApiKeys;
  private maxRetries: number;

  constructor(provider: ethers.providers.Provider, apiKeys: ApiKeys) {
    this.apiKeys = apiKeys;
    this.provider = provider;
    this.cache = new LRU<string, boolean>({
      max: 10000,
    });
    this.maxRetries = 3;
  }

  // Fetches transactions in descending order (newest first)
  private getEtherscanAddressUrl = (address: string, blockNumber: number, chainId: number) => {
    const { urlAccount } = etherscanApis[chainId];
    const key = this.getBlockExplorerKey(chainId);
    return `${urlAccount}&address=${address}&startblock=0&endblock=${blockNumber - 1}&sort=desc&apikey=${key}`;
  };

  private getBlockExplorerKey = (chainId: number) => {
    const getKey = (keys: string[]) =>
      keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : "YourApiKeyToken";

    switch (chainId) {
      case 250:
        return getKey(this.apiKeys.apiKeys.reentrancy.fantomscanApiKeys);

      default:
        return getKey(this.apiKeys.apiKeys.reentrancy.etherscanApiKeys);
    }
  };

  public isHighTxCountContract = async (contract: string, blockNumber: number, chainId: number) => {
    let attempts = 0;
    const cacheKey = `${contract}-${chainId}`;

    // Check if the result is already in the cache
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult !== undefined) {
      return cachedResult;
    }

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    while (attempts < this.maxRetries) {
      try {
        const response = await fetch(this.getEtherscanAddressUrl(contract, blockNumber, chainId));
        const result = await response.json();

        if (result.message.startsWith("NOTOK") || result.message.startsWith("Query Timeout")) {
          console.log(`Block explorer error or timeout occurred for ${contract}; attempting retry ${attempts + 1}`);
          throw new Error(result.message); // Force a retry
        }

        const hasHighNumberOfTotalTxs = result.result.length === CONTRACT_TRANSACTION_COUNT_THRESHOLD;
        if (hasHighNumberOfTotalTxs) {
          this.cache.set(cacheKey, true); // Cache the result only if it's true
        }
        return hasHighNumberOfTotalTxs;
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed for contract ${contract}: `, error);
        attempts++;

        if (attempts >= this.maxRetries) {
          console.error(`Max retries reached for contract ${contract}.`);
          return false;
        }

        await delay(1010); // Delay for 1.01 second
      }
    }
  };
}
