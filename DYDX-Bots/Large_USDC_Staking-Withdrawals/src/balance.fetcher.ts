import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { USDC_IFACE } from "./utils";

export default class BalanceFetcher {
  readonly provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber>>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber>>({
      max: 10000,
    });
  }

  public async getBalanceOf(moduleAddress: string, usdcAddress: string, block: string | number): Promise<BigNumber> {
    const key: string = `${moduleAddress} - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    const usdcContract = new Contract(usdcAddress, USDC_IFACE, this.provider);
    const balance = await usdcContract.balanceOf(moduleAddress, { blockTag: block });
    this.cache.set(key, balance);
    return balance;
  }
}
