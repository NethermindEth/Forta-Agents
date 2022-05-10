import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { BALANCE_ABI } from "./utils";
import NetworkData from "./network";

// This fetcher stores the dydx Balance of the Safety module.
export default class BalanceFetcher {
  provider: providers.Provider;
  private cache: LRU<string, BigNumber>;
  tokenContract: Contract;
  private networkManager: NetworkData;

  constructor(provider: providers.Provider, networkManager: NetworkData) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({
      max: 10000,
    });
    this.networkManager = networkManager;

    this.tokenContract = new Contract(
      this.networkManager.dydxAddress,
      BALANCE_ABI,
      this.provider
    );
  }
  public setTokenContract() {
    if (this.tokenContract.address != this.networkManager.dydxAddress) {
      this.tokenContract = new Contract(
        this.networkManager.dydxAddress,
        BALANCE_ABI,
        this.provider
      );
    }
  }

  public async getBalance(block: number | string): Promise<BigNumber> {
    const key: string = `${this.networkManager.safetyModule} - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const balance: BigNumber = this.tokenContract.balanceOf(
      this.networkManager.safetyModule,
      {
        blockTag: block,
      }
    );
    this.cache.set(key, balance);
    return balance;
  }
}
