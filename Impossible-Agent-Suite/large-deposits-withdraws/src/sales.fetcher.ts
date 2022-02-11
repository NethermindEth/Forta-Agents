import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { SALE_ABI } from "./utils";

export default class SalesFetcher {
  private provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber | Set<string>>>;
  private mock: boolean;

  constructor(provider: providers.Provider, mock: boolean) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber | Set<string>>>({
      max: 10000,
    });
    this.mock = mock;
  }

  public async getTotalPaymentReceived(
    block: number | string,
    contract: string
  ): Promise<BigNumber> {
    const key: string = `${contract}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;
    const saleContract = new Contract(contract, SALE_ABI, this.provider);
    const totalPaymentReceived: Promise<BigNumber> =
      saleContract.totalPaymentReceived({
        blockTag: this.mock ? block : undefined,
      });
    this.cache.set(key, totalPaymentReceived);
    return totalPaymentReceived;
  }
}
