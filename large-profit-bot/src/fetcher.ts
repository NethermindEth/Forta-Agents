import { providers, Contract, BigNumber, ethers } from "ethers";
import LRU from "lru-cache";
import { Interface } from "ethers/lib/utils";
import fetch from "node-fetch";
import { MAX_USD_VALUE, TOKEN_ABI } from "./utils";
import { CONTRACT_TRANSACTION_COUNT_THRESHOLD, etherscanApis } from "./config";

interface apiKeys {
  moralisApiKeys: string[];
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
  private cache: LRU<string, BigNumber | number | string>;
  private tokenContract: Contract;
  private tokensPriceCache: LRU<string, number>;
  private apiKeys: apiKeys;

  constructor(provider: ethers.providers.JsonRpcProvider, apiKeys: apiKeys) {
    this.apiKeys = apiKeys;
    this.provider = provider;
    this.tokenContract = new Contract("", new Interface(TOKEN_ABI), this.provider);
    this.cache = new LRU<string, BigNumber | number | string>({
      max: 10000,
    });
    this.tokensPriceCache = new LRU<string, number>({ max: 10000 });
  }

  public async getTotalSupply(block: number, tokenAddress: string): Promise<BigNumber> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `totalSupply-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const totalSupply: BigNumber = await token.totalSupply({
      blockTag: block,
    });

    this.cache.set(key, totalSupply);

    return totalSupply;
  }

  public async getDecimals(block: number | string, tokenAddress: string): Promise<number> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `decimals-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as number;

    let decimals: number;

    try {
      decimals = await token.decimals({
        blockTag: block,
      });
    } catch {
      decimals = 0;
    }

    this.cache.set(key, decimals);

    return decimals;
  }

  private getMoralisChainByChainId = (chainId: number) => {
    switch (Number(chainId)) {
      case 56:
        return "bsc";
      case 137:
        return "polygon";
      case 250:
        return "fantom";
      case 43114:
        return "avalanche";
      default:
        return "eth";
    }
  };

  private getUniswapPrice = async (chainId: number, token: string) => {
    if (!(this.apiKeys.moralisApiKeys.length > 0)) return 0;
    const moralisApiKey = this.apiKeys.moralisApiKeys[Math.floor(Math.random() * this.apiKeys.moralisApiKeys.length)];

    const options = {
      method: "GET",
      params: { chain: this.getMoralisChainByChainId(chainId) },
      headers: { accept: "application/json", "X-API-Key": moralisApiKey },
    };
    const response = (await (
      await fetch(`https://deep-index.moralis.io/api/v2/erc20/${token}/price`, options)
    ).json()) as any;
    return response.usdPrice;
  };

  private getTokenPriceUrl = (chain: string, token: string) => {
    return `https://api.coingecko.com/api/v3/simple/token_price/${chain}?contract_addresses=${token}&vs_currencies=usd`;
  };

  private getChainByChainId = (chainId: number) => {
    switch (Number(chainId)) {
      case 10:
        return "optimistic-ethereum";
      case 56:
        return "binance-smart-chain";
      case 137:
        return "polygon-pos";
      case 250:
        return "fantom";
      case 42161:
        return "arbitrum-one";
      case 43114:
        return "avalanche";
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
  private getEtherscanAddressUrl = (address: string, chainId: number) => {
    const { urlAccount } = etherscanApis[chainId];
    const key = this.getBlockExplorerKey(chainId);
    return `${urlAccount}&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${key}`;
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

  public isContractVerified = async (address: string, chainId: number) => {
    let result;

    result = await (await fetch(this.getEtherscanContractUrl(address, chainId))).json();

    if (result.message.startsWith("NOTOK") && result.result !== "Contract source code not verified") {
      console.log(`block explorer error occured; skipping check for ${address}`);
      return null;
    }

    const isVerified = result.status === "1";
    return isVerified;
  };

  public getContractInfo = async (contract: string, txFrom: string, chainId: number) => {
    let result;

    result = await (await fetch(this.getEtherscanAddressUrl(contract, chainId))).json();

    if (result.message.startsWith("NOTOK") || result.message.startsWith("Query Timeout")) {
      console.log(`block explorer error occured; skipping check for ${contract}`);
      return [null, null];
    }

    let numberOfInteractions: number = 0;
    result.result.forEach((tx: any) => {
      if (tx.from === txFrom) {
        numberOfInteractions++;
      }
    });

    const isFirstInteraction = numberOfInteractions <= 1;
    const hasHighNumberOfTotalTxs = result.result.length > CONTRACT_TRANSACTION_COUNT_THRESHOLD;

    return [isFirstInteraction, hasHighNumberOfTotalTxs];
  };

  public getContractCreator = async (address: string, chainId: number) => {
    const { urlContractCreation } = etherscanApis[chainId];
    const key = this.getBlockExplorerKey(chainId);
    const url = `${urlContractCreation}&contractaddresses=${address}&apikey=${key}`;

    const result = await (await fetch(url)).json();

    if (result.message.startsWith("NOTOK")) {
      console.log(`block explorer error occured; skipping check for ${address}`);
      return null;
    }

    return result.result[0].contractCreator;
  };

  public async getValueInUsd(block: number, chainId: number, amount: string, token: string): Promise<number> {
    let response, usdPrice;

    const key = `usdPrice-${token}-${block}`;
    if (this.tokensPriceCache.has(key)) {
      usdPrice = this.tokensPriceCache.get(key);
    } else {
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
        if (!response || !response[this.getNativeTokenByChainId(chainId)]) {
          if (this.tokensPriceCache.has(`usdPrice-${token}-${block - 1}`)) {
            usdPrice = this.tokensPriceCache.get(`usdPrice-${token}-${block - 1}`);
          } else return 0;
        } else {
          usdPrice = response[this.getNativeTokenByChainId(chainId)].usd;
        }
      } else {
        const chain = this.getChainByChainId(chainId);
        try {
          response = (await (await fetch(this.getTokenPriceUrl(chain, token))).json()) as any;
          if (response && response[token]) {
            usdPrice = response[token].usd;
          } else {
            throw new Error("Error: Can't fetch USD price on CoinGecko");
          }
        } catch {
          // Moralis API is not available on Optimism
          if (chainId === 10) {
            this.tokensPriceCache.set(`usdPrice-${token}-${block}`, 0);
            return 0;
          }
          try {
            usdPrice = await this.getUniswapPrice(chainId, token);
            if (!usdPrice) {
              this.tokensPriceCache.set(`usdPrice-${token}-${block}`, 0);
              return 0;
            }
          } catch {
            return 0;
          }
        }
      }
      this.tokensPriceCache.set(`usdPrice-${token}-${block}`, usdPrice);
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

  public getConfidenceLevel = (value: number, method: string) => {
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
      return Math.min(1, level);
    } else if (method === "totalSupply") {
      if (value >= 30) {
        return 1;
      } else if (value >= 20) {
        return 0.9;
      } else if (value >= 10) {
        return 0.8;
      } else if (value >= 5) {
        return 0.7;
      }
    }
  };
}
