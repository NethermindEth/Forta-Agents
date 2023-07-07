import { providers, ethers } from "ethers";
import LRU from "lru-cache";
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
  fetch: any;
  private apiKeys: apiKeys;
  private cache: LRU<string, boolean>;

  constructor(provider: ethers.providers.JsonRpcProvider, fetch: any, apiKeys: apiKeys) {
    this.apiKeys = apiKeys;
    this.provider = provider;
    this.fetch = fetch;
    this.cache = new LRU<string, boolean>({
      max: 10000,
    });
  }

  // Fetches transactions in descending order (newest first)
  private getEtherscanAddressUrl = (
    address: string,
    chainId: number,
    isToken: boolean,
    isQueue: boolean,
    isFundQuery: boolean,
    isInitialFunderQuery: boolean
  ) => {
    const url = isToken ? etherscanApis[chainId].urlAccountToken : etherscanApis[chainId].urlAccount;
    const key = this.getBlockExplorerKey(chainId);

    if (isInitialFunderQuery)
      return `${url}&address=${address}&startblock=0&endblock=99999999&sort=asc&page=1&offset=1&apikey=${key}`;

    if (isFundQuery) return `${url}&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${key}`;

    const offset = isQueue ? 1 : 501;
    return `${url}&address=${address}&startblock=0&endblock=99999999&sort=desc&page=1&offset=${offset}&apikey=${key}`;
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

  public getContractInfo = async (contract: string, chainId: number, isToken: boolean) => {
    const key: string = `${contract}`;
    if (this.cache.has(key)) return this.cache.get(key) as boolean;

    let result;

    result = await (
      await this.fetch(this.getEtherscanAddressUrl(contract, chainId, isToken, false, false, false))
    ).json();

    if (result.message.startsWith("NOTOK") || result.message.startsWith("Query Timeout")) {
      console.log(`block explorer error occured; skipping check for ${contract}`);

      return [null, null];
    }

    const hasHighNumberOfTotalTxs = result.result.length > CONTRACT_TRANSACTION_COUNT_THRESHOLD;

    this.cache.set(key, hasHighNumberOfTotalTxs);
    return hasHighNumberOfTotalTxs;
  };

  public getVictimInfo = async (address: string, chainId: number, timestamp: number) => {
    const result = await (
      await this.fetch(this.getEtherscanAddressUrl(address, chainId, false, true, false, false))
    ).json();

    if (result.message.startsWith("NOTOK") || result.message.startsWith("Query Timeout")) {
      console.log(`block explorer error occured; skipping check for ${address}`);

      return [null, null];
    }

    const isActive = result.result[0].timeStamp > timestamp;

    return isActive;
  };

  public getFundInfo = async (from: string, to: string, chainId: number) => {
    const result = await (
      await this.fetch(this.getEtherscanAddressUrl(from, chainId, false, false, true, false))
    ).json();

    const isFromFundedByTo = result.result.some((tx: any) => tx.from == to);
    return isFromFundedByTo;
  };

  public checkInitialFunder = async (
    txs: { victimAddress: string; transferredAsset: string; txHash: string }[],
    chainId: number
  ) => {
    const victimFunders = await Promise.all(
      txs.map(async (tx) => {
        const txResult = await (
          await this.fetch(this.getEtherscanAddressUrl(tx.victimAddress, chainId, false, false, false, true))
        ).json();

        const date = new Date(Number(txResult.result[0].timeStamp) * 1000).toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });

        return { from: txResult.result[0].from, timestamp: date };
      })
    );

    // if the funders or dates in the first txns are not unique, return false
    if (
      txs.length != new Set(victimFunders.map((el) => el.from)).size ||
      txs.length != new Set(victimFunders.map((el) => el.timestamp)).size
    )
      return false;

    // check internal transfers to see if the addresses were funded by the same contract
    let internalFunders = await Promise.all(
      txs.map(async (tx) => {
        const internalTxResult = await (
          await this.fetch(
            `${etherscanApis[chainId].urlAccount}internal&address=${
              tx.victimAddress
            }&startblock=0&endblock=99999999&sort=asc&page=1&offset=1&apikey=${this.getBlockExplorerKey(chainId)}`
          )
        ).json();

        if (internalTxResult.result.length) {
          return internalTxResult.result[0].from;
        }
      })
    );

    // remove addresses which don't have internal transactions
    internalFunders = internalFunders.filter((el) => el);

    return internalFunders.length === new Set(internalFunders).size;
  };
}
