import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { SALE_ABI } from "./utils";

export default class SalesFetcher {
  private provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber | Set<string>>>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber | Set<string>>>({
      max: 10000,
    });
  }

  public async getTotalPaymentReceived(block: number | string, contract: string): Promise<BigNumber> {
    const key: string = `${block}-${contract}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;
    const saleContract = new Contract(contract, SALE_ABI, this.provider);
    const totalPaymentReceived: Promise<BigNumber> = saleContract.totalPaymentReceived({
      blockTag: block,
    });
    this.cache.set(key, totalPaymentReceived);
    return totalPaymentReceived;
  }
}
