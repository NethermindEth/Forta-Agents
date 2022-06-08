import { providers, Contract, BigNumber } from "ethers";
import { SUPPLY_IFACE } from "./utils";
import LRU from "lru-cache";

export default class SupplyFetcher {
  provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber>>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber>>({
      max: 10000,
    });
  }

  public async getTotalSupply(
    jToken: string,
    block: number | string
  ): Promise<BigNumber> {
    const key: string = `${jToken}-${block}`;

    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    try {
      const jTokenContract = new Contract(jToken, SUPPLY_IFACE, this.provider);
      const supply = jTokenContract.totalSupply({ blockTag: block });

      this.cache.set(key, supply);
      return supply;
    } catch {
      // If the network call fails, we return 0 to avoid a crash.
      // This value is not saved on cache to allow the bot to fetch the correct supply when the function is called another time.
      return BigNumber.from(0);
    }
  }
}
