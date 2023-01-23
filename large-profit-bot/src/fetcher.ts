import { providers, Contract, BigNumber, ethers } from "ethers";
import LRU from "lru-cache";
import { Interface } from "ethers/lib/utils";
import { MAX_USD_VALUE, TOKEN_ABI } from "./utils";

interface apiKeys {
  // ethplorerApiKey?: string;
  moralisApiKey?: string;
  // etherscanApiKey?: string;
  // optimisticEtherscanApiKey?: string;
  // bscscanApiKey?: string;
  // polygonscanApiKey?: string;
  // fantomscanApiKey?: string;
  // arbiscanApiKey?: string;
  // snowtraceApiKey?: string;
}

const restApis: Record<string, string> = {
  //ethplorerKey: "",
  moralisKey: "",
};

// interface etherscanApisInterface {
//   [key: number]: {
//     key: string;
//     urlContractName: string;
//     urlContractCreation: string;
//   };
// }

// const etherscanApis: etherscanApisInterface = {
//   1: {
//     key: "",
//     urlContractName: "https://api.etherscan.io/api?module=contract&action=getsourcecode",
//     urlContractCreation: "https://api.etherscan.io/api?module=contract&action=getcontractcreation",
//   },
//   10: {
//     key: "",
//     urlContractName: "https://api-optimistic.etherscan.io/api?module=contract&action=getsourcecode",
//     urlContractCreation: "https://api-optimistic.etherscan.io/api?module=contract&action=getcontractcreation",
//   },
//   56: {
//     key: "",
//     urlContractName: "https://api.bscscan.com/api?module=contract&action=getsourcecode",
//     urlContractCreation: "https://api.bscscan.com/api?module=contract&action=getcontractcreation",
//   },
//   137: {
//     key: "",
//     urlContractName: "https://api.polygonscan.com/api?module=contract&action=getsourcecode",
//     urlContractCreation: "https://api.polygonscan.com/api?module=contract&action=getcontractcreation",
//   },
//   250: {
//     key: "",
//     urlContractName: "https://api.ftmscan.com/api?module=contract&action=getsourcecode",
//     urlContractCreation: "https://api.ftmscan.com/api?module=contract&action=getcontractcreation",
//   },
//   42161: {
//     key: "",
//     urlContractName: "https://api.arbiscan.io/api?module=contract&action=getsourcecode",
//     urlContractCreation: "https://api.arbiscan.io/api?module=contract&action=getcontractcreation",
//   },
//   43114: {
//     key: "",
//     urlContractName: "https://api.snowtrace.io/api?module=contract&action=getsourcecode",
//     urlContractCreation: "https://api.snowtrace.io/api?module=contract&action=getcontractcreation",
//   },
// };

export default class Fetcher {
  provider: providers.JsonRpcProvider;
  private cache: LRU<string, BigNumber | number | string>;
  private tokenContract: Contract;
  private tokensPriceCache: LRU<string, number>;

  constructor(provider: ethers.providers.JsonRpcProvider, apiKeys: apiKeys) {
    // Extract the keys or set default values
    const {
      //ethplorerApiKey = "freekey",
      moralisApiKey = "",
      // etherscanApiKey = "YourApiKeyToken",
      // optimisticEtherscanApiKey = "YourApiKeyToken",
      // bscscanApiKey = "YourApiKeyToken",
      // polygonscanApiKey = "YourApiKeyToken",
      // fantomscanApiKey = "YourApiKeyToken",
      // arbiscanApiKey = "YourApiKeyToken",
      // snowtraceApiKey = "YourApiKeyToken",
    } = apiKeys;

    // Set the keys
    //restApis["ethplorerKey"] = ethplorerApiKey;
    restApis["moralisKey"] = moralisApiKey;
    // etherscanApis[1].key = etherscanApiKey;
    // etherscanApis[10].key = optimisticEtherscanApiKey;
    // etherscanApis[56].key = bscscanApiKey;
    // etherscanApis[137].key = polygonscanApiKey;
    // etherscanApis[250].key = fantomscanApiKey;
    // etherscanApis[42161].key = arbiscanApiKey;
    // etherscanApis[43114].key = snowtraceApiKey;

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

  private async getDecimals(block: number | string, tokenAddress: string): Promise<number> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `decimals-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as number;

    const decimals: number = await token.decimals({
      blockTag: block,
    });

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
    if (restApis["moralisKey"] === "") return 0;

    const options = {
      method: "GET",
      params: { chain: this.getMoralisChainByChainId(chainId) },
      headers: { accept: "application/json", "X-API-Key": restApis["moralisKey"] },
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
          if (chainId === 10 || chainId === 42161) return 0; // Moralis API is not available on Optimism & Arbitrum
          try {
            usdPrice = await this.getUniswapPrice(chainId, token);
            if (!usdPrice) return 0;
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

  public getExploitationStageConfidenceLevel = (value: number, method: string) => {
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
