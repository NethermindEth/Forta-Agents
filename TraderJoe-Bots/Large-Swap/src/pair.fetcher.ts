import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { PAIR_IFACE } from "./utils";

export default class PairFetcher {
  readonly pairAddress: string;
  private pairContract: Contract;
  private cache: LRU<string, boolean>;

  constructor(pair: string, provider: providers.Provider) {
    this.pairAddress = pair;
    this.pairContract = new Contract(pair, PAIR_IFACE, provider);
    this.cache = new LRU<string, boolean>({ max: 10000 });
  }

  public async getToken0(block: string | number): Promise<string> {
    const key: string = `token0 - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<string>;

    const token0 = await this.pairContract.token0({ blockTag: block });
    this.cache.set(key, token0);
    return token0;
  }

  public async getToken1(block: string | number): Promise<string> {
    const key: string = `token1 - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<string>;

    const token1 = await this.pairContract.token1({ blockTag: block });
    this.cache.set(key, token1);
    return token1;
  }

  public async getReserves(block: string | number): Promise<BigNumber[]> {
    const key: string = `reserves - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber[]>;

    const reserves = await this.pairContract.getReserves({ blockTag: block });
    this.cache.set(key, reserves);
    return reserves;
  }
}
