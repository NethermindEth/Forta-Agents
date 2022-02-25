import { providers, Contract } from "ethers";
import LRU from "lru-cache";
import { REALITY_ABI } from "./utils";

export default class OracleFetcher {
  private provider: providers.Provider;
  private cache: LRU<string, Promise<string>>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<string>>({
      max: 10000,
    });
  }

  public async getOracle(
    block: number | string,
    contract: string
  ): Promise<string> {
    const key: string = `${contract} - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<string>;
    const RealityContract = new Contract(
      contract.toLowerCase(),
      REALITY_ABI,
      this.provider
    );
    const oracle: Promise<string> = RealityContract.oracle({
      blockTag: block,
    });
    this.cache.set(key, oracle);
    return oracle;
  }
}
