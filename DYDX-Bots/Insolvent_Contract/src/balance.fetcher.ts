import { providers, BigNumber, Contract } from "ethers";
import LRU from "lru-cache";
import NetworkData from "./network";
import { IMPLEMENTATION_IFACE } from "./utils";

export default class BalanceFetcher {
  readonly provider: providers.Provider;
  private cache: LRU<string, BigNumber>;
  private networkManager: NetworkData;
  private moduleContract: Contract;

  constructor(provider: providers.Provider, networkManager: NetworkData) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({
      max: 10000,
    });
    this.networkManager = networkManager;
    // Using implementation ABI since I am calling the proxy's fallback function
    this.moduleContract = new Contract(networkManager.liquidityModule, IMPLEMENTATION_IFACE, provider);
  }

  public setModuleContract() {
    if (this.moduleContract.address != this.networkManager.liquidityModule) {
      this.moduleContract = new Contract(this.networkManager.liquidityModule, IMPLEMENTATION_IFACE, this.provider);
    }
  }

  public async getTotalBorrowerDebtBalance(block: string | number): Promise<BigNumber> {
    const key: string = `${this.moduleContract} - totalBorrowerDebtBalance - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    const balance = await this.moduleContract.getTotalBorrowerDebtBalance({ blockTag: block });
    this.cache.set(key, balance);
    return balance;
  }

  public async getTotalActiveBalanceCurrentEpoch(block: string | number): Promise<BigNumber> {
    const key: string = `${this.moduleContract} - totalActiveBalanceCurrentEpoch - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    const balance = await this.moduleContract.getTotalActiveBalanceCurrentEpoch({ blockTag: block });
    this.cache.set(key, balance);
    return balance;
  }
}
