import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { IMPLEMENTATION_IFACE } from "./utils";

export default class BalanceFetcher {
  readonly provider: providers.Provider;
  private cache: LRU<string, BigNumber>;
  readonly proxyAddress: string;

  constructor(provider: providers.Provider, proxyAddr: string) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({
      max: 10000,
    });
    this.proxyAddress = proxyAddr;
  }

  public async getTotalBorrowerDebtBalance(block: string | number): Promise<BigNumber> {
    const key: string = `totalBorrowerDebtBalance - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    const balance: BigNumber = BigNumber.from(
      await this.provider.call({
        to: this.proxyAddress,
        data: IMPLEMENTATION_IFACE.getSighash("getTotalBorrowerDebtBalance"),
      }, "latest")
    );
    this.cache.set(key, balance);
    return balance;
  }

  public async getTotalActiveBalanceCurrentEpoch(block: string | number): Promise<BigNumber> {
    const key: string = `totalActiveBalanceCurrentEpoch - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    const balance: BigNumber = BigNumber.from(
      await this.provider.call({
        to: this.proxyAddress,
        data: IMPLEMENTATION_IFACE.getSighash("getTotalActiveBalanceCurrentEpoch"),
      }, "latest")
    );
    this.cache.set(key, balance);
    return balance;
  }
}
