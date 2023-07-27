import { providers, Contract, BigNumber, ethers } from "ethers";
import LRU from "lru-cache";
import { Interface } from "ethers/lib/utils";
import fetch from "node-fetch";
import { TOKEN_ABI } from "./utils";

export default class PriceFetcher {
  provider: providers.JsonRpcProvider;
  private cache: LRU<string, BigNumber | number | string>;
  private tokenContract: Contract;
  private tokensPriceCache: LRU<string, number>;

  constructor(provider: ethers.providers.JsonRpcProvider) {
    this.provider = provider;
    this.tokenContract = new Contract("", new Interface(TOKEN_ABI), this.provider);
    this.cache = new LRU<string, BigNumber | number | string>({
      max: 10000,
    });
    this.tokensPriceCache = new LRU<string, number>({ max: 10000 });
  }

  private async getDecimals(block: number | string, tokenAddress: string): Promise<number> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `decimals-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as number;

    const retryCount = 3;
    let decimals: number = 0;

    for (let i = 0; i <= retryCount; i++) {
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
        if (i === retryCount) {
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
    let foundInCache = false;

    for (let i = block - 9; i <= block; i++) {
      const key = `usdPrice-${token}-${i}`;
      if (this.tokensPriceCache.has(key)) {
        usdPrice = this.tokensPriceCache.get(key);
        foundInCache = true;
        break;
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
        let retryCount = 1;
        for (let i = 0; i < retryCount; i++) {
          try {
            response = (await (await fetch(this.getTokenPriceUrl(chain, token))).json()) as any;
            if (response && response[token]) {
              usdPrice = response[token].usd;
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
}
