import { providers, Contract, BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import LRU from "lru-cache";
import { TOKEN_ABI } from "./utils";

export default class BalanceFetcher {
  readonly provider: providers.Provider;
  private cache: LRU<string, BigNumber>;
  private tokenContract: Contract;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({
      max: 10000,
    });
    this.tokenContract = new Contract("", new Interface([TOKEN_ABI[0]]), this.provider);
  }

  public async getBalanceOf(victimAddress: string, tokenAddress: string, block: string | number): Promise<BigNumber> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `${tokenAddress}-${victimAddress}-${block}`;

    const cachedBalance = this.cache.get(key);
    if (cachedBalance) return cachedBalance;

    try {
      const balance = await token.balanceOf(victimAddress, {
        blockTag: block,
      });

      this.cache.set(key, balance);

      return balance;
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      throw error;
    }
  }
}
