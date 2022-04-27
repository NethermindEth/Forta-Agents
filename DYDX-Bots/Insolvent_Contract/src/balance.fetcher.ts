import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { IMPLEMENTATION_IFACE } from "./utils";

export default class BalanceFetcher {
  readonly provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber>>;
  readonly proxyAddress: string;
  private proxyContract: Contract;

  constructor(provider: providers.Provider, proxyAddr: string) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber>>({
      max: 10000,
    });
    this.proxyAddress = proxyAddr;
    // Create proxy contract instance using the Interface of the implementation contract
    // source: https://github.com/ethers-io/ethers.js/issues/182#issuecomment-826387240
    this.proxyContract = new Contract(proxyAddr, IMPLEMENTATION_IFACE, provider);
  }

  public async getTotalBorrowerDebtBalance(block: string | number): Promise<BigNumber> {
    const key: string = `${this.proxyContract} - totalBorrowerDebtBalance - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    const balance = await this.proxyContract.getTotalBorrowerDebtBalance({ blockTag: block });
    this.cache.set(key, balance);
    return balance;
  }

  public async getTotalActiveBalanceCurrentEpoch(block: string | number): Promise<BigNumber> {
    const key: string = `${this.proxyContract} - totalActiveBalanceCurrentEpoch - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    const balance = await this.proxyContract.getTotalActiveBalanceCurrentEpoch({ blockTag: block });
    this.cache.set(key, balance);
    return balance;
  }
}
