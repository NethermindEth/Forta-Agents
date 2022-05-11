import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { INACTIVE_BALANCE_ABI } from "./utils";
import NetworkData from "./network";

// This fetcher stores the inactive Balance of different stakers on the safety module.
export default class InactiveBalanceFetcher {
  provider: providers.Provider;
  private cache: LRU<string, BigNumber>;
  safetyContract: Contract;
  private networkManager: NetworkData;

  constructor(provider: providers.Provider, networkManager: NetworkData) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({
      max: 10000,
    });
    this.networkManager = networkManager;
    this.safetyContract = new Contract(this.networkManager.safetyModule, INACTIVE_BALANCE_ABI, this.provider);
  }

  public setSafetyModule() {
    if (this.safetyContract.address != this.networkManager.safetyModule) {
      this.safetyContract = new Contract(this.networkManager.safetyModule, INACTIVE_BALANCE_ABI, this.provider);
    }
  }

  public async getInactiveBalance(staker: string, block: number | string): Promise<BigNumber> {
    const key: string = `${staker} - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const inactiveBalance: BigNumber = this.safetyContract.getInactiveBalanceNextEpoch(staker, {
      blockTag: block,
    });
    this.cache.set(key, inactiveBalance);
    return inactiveBalance;
  }
}
