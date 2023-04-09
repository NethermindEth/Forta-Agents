import { providers, ethers } from "ethers";
import LRU from "lru-cache";
import fetch from "node-fetch";
import { CONTRACT_TRANSACTION_COUNT_THRESHOLD, etherscanApis } from "./bot.config";

interface apiKeys {
  etherscanApiKeys: string[];
  optimisticEtherscanApiKeys: string[];
  bscscanApiKeys: string[];
  polygonscanApiKeys: string[];
  fantomscanApiKeys: string[];
  arbiscanApiKeys: string[];
  snowtraceApiKeys: string[];
}

export default class Fetcher {
  provider: providers.JsonRpcProvider;
  private apiKeys: apiKeys;
  private cache: LRU<string, boolean>;

  constructor(provider: ethers.providers.JsonRpcProvider, apiKeys: apiKeys) {
    this.apiKeys = apiKeys;
    this.provider = provider;
    this.cache = new LRU<string, boolean>({
      max: 10000,
    });
  }

  // Fetches transactions in descending order (newest first)
  private getEtherscanAddressUrl = (address: string, chainId: number, isToken: boolean) => {
    const url = isToken ? etherscanApis[chainId].urlAccountToken : etherscanApis[chainId].urlAccount;
    const key = this.getBlockExplorerKey(chainId);
    return `${url}&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${key}`;
  };

  private getBlockExplorerKey = (chainId: number) => {
    switch (chainId) {
      case 10:
        return this.apiKeys.optimisticEtherscanApiKeys.length > 0
          ? this.apiKeys.optimisticEtherscanApiKeys[
              Math.floor(Math.random() * this.apiKeys.optimisticEtherscanApiKeys.length)
            ]
          : "YourApiKeyToken";
      case 56:
        return this.apiKeys.bscscanApiKeys.length > 0
          ? this.apiKeys.bscscanApiKeys[Math.floor(Math.random() * this.apiKeys.bscscanApiKeys.length)]
          : "YourApiKeyToken";
      case 137:
        return this.apiKeys.polygonscanApiKeys.length > 0
          ? this.apiKeys.polygonscanApiKeys[Math.floor(Math.random() * this.apiKeys.polygonscanApiKeys.length)]
          : "YourApiKeyToken";
      case 250:
        return this.apiKeys.fantomscanApiKeys.length > 0
          ? this.apiKeys.fantomscanApiKeys[Math.floor(Math.random() * this.apiKeys.fantomscanApiKeys.length)]
          : "YourApiKeyToken";
      case 42161:
        return this.apiKeys.arbiscanApiKeys.length > 0
          ? this.apiKeys.arbiscanApiKeys[Math.floor(Math.random() * this.apiKeys.arbiscanApiKeys.length)]
          : "YourApiKeyToken";
      case 43114:
        return this.apiKeys.snowtraceApiKeys.length > 0
          ? this.apiKeys.snowtraceApiKeys[Math.floor(Math.random() * this.apiKeys.snowtraceApiKeys.length)]
          : "YourApiKeyToken";
      default:
        return this.apiKeys.etherscanApiKeys.length > 0
          ? this.apiKeys.etherscanApiKeys[Math.floor(Math.random() * this.apiKeys.etherscanApiKeys.length)]
          : "YourApiKeyToken";
    }
  };

  public getContractInfo = async (contract: string, chainId: number, isToken: boolean, blockNumber: number) => {
    const key: string = `${contract}-${blockNumber}`;
    if (this.cache.has(key)) return this.cache.get(key) as boolean;

    let result;

    result = await (await fetch(this.getEtherscanAddressUrl(contract, chainId, isToken))).json();

    if (result.message.startsWith("NOTOK") || result.message.startsWith("Query Timeout")) {
      console.log(`block explorer error occured; skipping check for ${contract}`);
      return [null, null];
    }

    const hasHighNumberOfTotalTxs = result.result.length > CONTRACT_TRANSACTION_COUNT_THRESHOLD;

    this.cache.set(key, hasHighNumberOfTotalTxs);
    return hasHighNumberOfTotalTxs;
  };
}
