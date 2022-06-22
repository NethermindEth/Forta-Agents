import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { SUPPLY_ABI } from "./utils";

export default class StakeFetcher {
  private provider: providers.Provider;
  private cache: LRU<string, BigNumber>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({ max: 10000 });
  }
  public async getTotalSupply(contract: string, block: number | string): Promise<BigNumber> {
    const key: string = `${block}-${contract}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;
    const pContract = new Contract(contract, SUPPLY_ABI, this.provider);
    const totalSupply = await pContract.totalSupply({
      blockTag: block,
    });
    this.cache.set(key, totalSupply);

    return totalSupply;
  }
}
