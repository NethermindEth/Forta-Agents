import { providers, Contract, BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import LRU from "lru-cache";
import { TOKEN_ABI } from "./utils";

export default class BalanceFetcher {
  readonly provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber>>;
  private tokenContract: Contract;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber>>({
      max: 10000,
    });
    this.tokenContract = new Contract("", new Interface([TOKEN_ABI[0]]), this.provider);
  }

  public async getBalanceOf(victimAddress: string, tokenAddress: string, block: string | number): Promise<BigNumber> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `${tokenAddress}-${victimAddress}-${block}`;

    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    const balance = await token.balanceOf(victimAddress, {
      blockTag: block,
    });

    this.cache.set(key, balance);

    return balance;
  }
}
