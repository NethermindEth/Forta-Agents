import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import NetworkData from "./network";
import { USDC_IFACE } from "./utils";

export default class BalanceFetcher {
  readonly provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber>>;
  readonly usdcAddress: string;
  private usdcContract: Contract;

  constructor(provider: providers.Provider, networkManager: NetworkData) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber>>({
      max: 10000,
    });
    this.usdcAddress = networkManager.usdcAddress;
    this.usdcContract = new Contract(networkManager.usdcAddress, USDC_IFACE, provider);
  }

  public async getBalanceOf(address: string, block: string | number): Promise<BigNumber> {
    const key: string = `${address} - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    const balance = await this.usdcContract.balanceOf(address, { blockTag: block });
    this.cache.set(key, balance);
    return balance;
  }
}
