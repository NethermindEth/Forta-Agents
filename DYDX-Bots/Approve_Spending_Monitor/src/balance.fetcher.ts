import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import NetworkData from "./network";
import { BALANCEOF_ABI } from "./utils";

export default class BalanceFetcher {
  readonly provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber>>;
  private networkManager: NetworkData;
  private usdcContract: Contract;
  private dydxContract: Contract;

  constructor(provider: providers.Provider, networkManager: NetworkData) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber>>({
      max: 10000,
    });
    this.networkManager = networkManager;
    this.usdcContract = new Contract(networkManager.usdcAddress, BALANCEOF_ABI, provider);
    this.dydxContract = new Contract(networkManager.dydxAddress, BALANCEOF_ABI, provider);
  }

  public setTokensContract() {
    if (this.usdcContract.address != this.networkManager.usdcAddress) {
      this.usdcContract = new Contract(this.networkManager.usdcAddress, BALANCEOF_ABI, this.provider);
    }
    if (this.dydxContract.address != this.networkManager.dydxAddress) {
      this.dydxContract = new Contract(this.networkManager.dydxAddress, BALANCEOF_ABI, this.provider);
    }
  }

  public async getdydxBalanceOf(moduleAddress: string, block: string | number): Promise<BigNumber> {
    const key: string = `${this.networkManager.dydxAddress}- ${moduleAddress}-${block}`;

    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    const balance = await this.dydxContract.balanceOf(moduleAddress, { blockTag: block });
    this.cache.set(key, balance);

    return balance;
  }

  public async getUsdcBalanceOf(moduleAddress: string, block: string | number): Promise<BigNumber> {
    const key: string = `${this.networkManager.usdcAddress}- ${moduleAddress}-${block}`;

    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    const balance = await this.usdcContract.balanceOf(moduleAddress, { blockTag: block });
    this.cache.set(key, balance);

    return balance;
  }
}
