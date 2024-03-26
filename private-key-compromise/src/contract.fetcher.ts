import { providers, ethers } from "ethers";
import LRU from "lru-cache";
import { CONTRACT_TRANSACTION_COUNT_THRESHOLD, etherscanApis } from "./bot.config";
import { BlockExplorerApiKeys } from "./storage";

const getApiKey = (keys: string[]) => {
  return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : "YourApiKeyToken";
};

export default class Fetcher {
  provider: providers.Provider;
  fetch: any;
  private apiKeys: BlockExplorerApiKeys;
  private cache: LRU<string, boolean>;

  constructor(provider: ethers.providers.Provider, fetch: any, apiKeys: BlockExplorerApiKeys) {
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
        return getApiKey(this.apiKeys.optimisticEtherscanApiKeys);
      case 56:
        return getApiKey(this.apiKeys.bscscanApiKeys);
      case 137:
        return getApiKey(this.apiKeys.polygonscanApiKeys);
      case 250:
        return getApiKey(this.apiKeys.fantomscanApiKeys);
      case 42161:
        return getApiKey(this.apiKeys.arbiscanApiKeys);
      case 43114:
        return getApiKey(this.apiKeys.snowtraceApiKeys);
      default:
        return getApiKey(this.apiKeys.etherscanApiKeys);
    }
  };

  public getContractInfo = async (contract: string, chainId: number, isToken: boolean) => {
    const key: string = `${contract}`;
    if (this.cache.has(key)) return this.cache.get(key) as boolean;

    try {
      const result = await (
        await this.fetch(this.getEtherscanAddressUrl(contract, chainId, isToken, false, false, false))
      ).json();

      if (result.message.startsWith("NOTOK") || result.message.startsWith("Query Timeout")) {
        console.log(`block explorer error occured; skipping check for ${contract}`);

        return true;
      }

      const hasHighNumberOfTotalTxs = result.result.length > CONTRACT_TRANSACTION_COUNT_THRESHOLD;

      this.cache.set(key, hasHighNumberOfTotalTxs);
      return hasHighNumberOfTotalTxs;
    } catch (error) {
      console.error(`Error fetching data for contract ${contract}:`, error);

      return true;
    }
  };

  public getVictimInfo = async (address: string, chainId: number, timestamp: number) => {
    try {
      const result = await (
        await this.fetch(this.getEtherscanAddressUrl(address, chainId, false, true, false, false))
      ).json();

      if (result.message.startsWith("NOTOK") || result.message.startsWith("Query Timeout")) {
        console.log(`block explorer error occured; skipping check for ${address}`);

        return true;
      }

      const isActive = result.result[0].timeStamp > timestamp;

      return isActive;
    } catch (error) {
      console.error(`Error fetching victim info ${address}:`, error);
      return true;
    }
  };

  public getFundInfo = async (from: string, to: string, chainId: number) => {
    try {
      const result = await (
        await this.fetch(this.getEtherscanAddressUrl(from, chainId, false, false, true, false))
      ).json();

      if (result.message === "OK") {
        const isFromFundedByTo = result.result.some((tx: any) => tx.from == to);
        return isFromFundedByTo;
      } else {
        return true;
      }
    } catch (error) {
      console.error(`Error fetching fund info ${from}:`, error);
      return true;
    }
  };

  public checkInitialFunder = async (
    txs: { victimAddress: string; transferredAsset: string; txHash: string }[],
    chainId: number
  ) => {
    const victimFunders = await Promise.all(
      txs.map(async (tx) => {
        try {
          const txResult = await (
            await this.fetch(this.getEtherscanAddressUrl(tx.victimAddress, chainId, false, false, false, true))
          ).json();

          const date = new Date(Number(txResult.result[0].timeStamp) * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });

          return { from: txResult.result[0].from, timestamp: date };
        } catch (error) {
          console.error(`Error fetching initial funder ${tx.victimAddress}:`, error);
        }
      })
    );

    // if the funders or dates in the first txns are not unique, return false
    if (
      txs.length != new Set(victimFunders.map((el) => el?.from)).size ||
      txs.length != new Set(victimFunders.map((el) => el?.timestamp)).size
    ) {
      return false;
    } else {
      return true;
    }

    // NOTE: Commenting out this part as EOAs cannot send internal transactions.
    // Therefore, this would only really eliminate duplicate contracts.
    // Because unrelated victim accounts could be funded by widely-used contracts,
    // and not necessarily be associated with one another,
    // it is not a great heuristic to rely on unique contracts.
    //
    // // check internal transfers to see if the addresses were funded by the same contract
    // let internalFunders = await Promise.all(
    //   txs.map(async (tx) => {
    //     try {
    //       const internalTxResult = await (
    //         await this.fetch(
    //           `${etherscanApis[chainId].urlAccount}internal&address=${
    //             tx.victimAddress
    //           }&startblock=0&endblock=99999999&sort=asc&page=1&offset=1&apikey=${this.getBlockExplorerKey(chainId)}`
    //         )
    //       ).json();

    //       if (internalTxResult.result.length) {
    //         return internalTxResult.result[0].from;
    //       }
    //     } catch (error) {
    //       console.error(`Error fetching internal transfers ${tx.victimAddress}:`, error);
    //     }
    //   })
    // );

    // // remove addresses which don't have internal transactions
    // internalFunders = internalFunders.filter((el) => el);

    // return internalFunders.length === new Set(internalFunders).size;
  };
}
