import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { BALANCEOF_ABI } from "./utils";

export default class BalanceFetcher {
  readonly provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber>>;
  private tokenAddress: string;
  private tokenContract: Contract;

  constructor(provider: providers.Provider, tokenAddress: string) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber>>({
      max: 10000,
    });
    this.tokenAddress = tokenAddress;
    this.tokenContract = new Contract(tokenAddress, BALANCEOF_ABI, provider);
  }

  public async getBalanceOf(
    victimAddress: string,
    block: string | number
  ): Promise<BigNumber> {
    const key: string = `${this.tokenAddress}-${victimAddress}-${block}`;

    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    if (this.tokenContract.address != this.tokenAddress) {
      this.tokenContract = new Contract(this.tokenAddress, BALANCEOF_ABI, this.provider);
    }

    const balance = await this.tokenContract.balanceOf(victimAddress, {
      blockTag: block,
    });

    this.cache.set(key, balance);

    return balance;
  }
}
