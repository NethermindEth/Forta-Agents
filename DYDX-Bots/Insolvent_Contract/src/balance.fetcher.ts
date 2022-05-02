import { providers, BigNumber, Contract } from "ethers";
import LRU from "lru-cache";
import { IMPLEMENTATION_IFACE } from "./utils";

export default class BalanceFetcher {
  readonly provider: providers.Provider;
  private cache: LRU<string, BigNumber>;
  readonly proxyAddress: string;
  private proxyContract: Contract;

  constructor(provider: providers.Provider, proxyAddr: string) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({
      max: 10000,
    });
    this.proxyAddress = proxyAddr;
    // Using implementation ABI since I am calling the proxy's fallback function
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
