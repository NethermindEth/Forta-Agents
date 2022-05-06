import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import NetworkData from "./network";
import { USDC_IFACE } from "./utils";

export default class BalanceFetcher {
  readonly provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber>>;
  private usdcContract: Contract;

  constructor(provider: providers.Provider, networkData: NetworkData) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber>>({
      max: 10000,
    });
    this.usdcContract = new Contract(networkData.usdcAddress, USDC_IFACE, provider);
  }

  public async getBalanceOf(moduleAddress: string, block: string | number): Promise<BigNumber> {
    const key: string = `${moduleAddress} - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    const balance = await this.usdcContract.balanceOf(moduleAddress, { blockTag: block });
    this.cache.set(key, balance);
    return balance;
  }
}
