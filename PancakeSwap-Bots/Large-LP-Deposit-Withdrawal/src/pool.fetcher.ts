import { Contract, BigNumber, providers } from "ethers";
import { FUNCTIONS_ABI } from "./constants";
import LRU from "lru-cache";

export default class PoolFetcher {
  private provider: providers.Provider;
  private cache: LRU<string, any[]>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, any[]>({ max: 10000 });
  }

  public async getPoolData(block: number, poolAddress: string): Promise<[boolean, string, string, BigNumber]> {
    let returnedValues: [boolean, string, string, BigNumber];
    const key: string = `pool-${poolAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as [boolean, string, string, BigNumber];
    const pool = new Contract(poolAddress, FUNCTIONS_ABI, this.provider);
    try {
      const [token0, token1, totalSupply] = await Promise.all([
        pool.token0({ blockTag: block }),
        pool.token1({ blockTag: block }),
        pool.totalSupply({ blockTag: block }),
      ]);
      returnedValues = [true, token0.toLowerCase(), token1.toLowerCase(), totalSupply];
    } catch {
      returnedValues = [false, "", "", BigNumber.from(0)];
    }
    this.cache.set(key, returnedValues);
    return returnedValues;
  }

  public async getPoolBalance(
    block: number,
    poolAddress: string,
    token0: string,
    token1: string
  ): Promise<[BigNumber, BigNumber]> {
    const key: string = `poolBalance-${poolAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as [BigNumber, BigNumber];
    const token0Contract = new Contract(token0, FUNCTIONS_ABI, this.provider);
    const token1Contract = new Contract(token1, FUNCTIONS_ABI, this.provider);
    let returnedValues: [BigNumber, BigNumber];
    try {
      const [balance0, balance1] = await Promise.all([
        token0Contract.balanceOf(poolAddress, { blockTag: block }),
        token1Contract.balanceOf(poolAddress, { blockTag: block }),
      ]);
      returnedValues = [BigNumber.from(balance0), BigNumber.from(balance1)];
    } catch {
      returnedValues = [BigNumber.from(0), BigNumber.from(0)];
    }
    this.cache.set(key, returnedValues);
    return returnedValues;
  }
}
