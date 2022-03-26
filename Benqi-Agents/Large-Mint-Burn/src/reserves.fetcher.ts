import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { RESERVES_FUNCTION } from "./utils";

export default class ReservesFetcher {
  provider: providers.Provider;
  private cache: LRU<string, Promise<[BigNumber, BigNumber]>>;
  pglAddress: string;
  private pglContract: Contract;

  constructor(provider: providers.Provider, contractAddr: string) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<[BigNumber, BigNumber]>>({
      max: 10000,
    });
    this.pglAddress = contractAddr;
    this.pglContract = new Contract(contractAddr, RESERVES_FUNCTION, provider);
  }

  public async getReserves(block: number | string): Promise<[BigNumber, BigNumber]> {
    const key: string = `${this.pglContract} - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<[BigNumber, BigNumber]>;

    const reserves: Promise<[BigNumber, BigNumber]> = this.pglContract.getReserves({
      blockTag: block,
    });
    this.cache.set(key, reserves);
    return reserves;
  }
}
