import { providers } from "ethers";
import LRU from "lru-cache";

export default class DataFetcher {
  readonly provider: providers.Provider;
  private eoaCache: LRU<string, boolean>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.eoaCache = new LRU<string, boolean>({ max: 10000 });
  }

  isEoa = async (address: string) => {
    if (this.eoaCache.has(address)) return this.eoaCache.get(address) as boolean;
    let code;

    for (let tries = 0; tries < 3; tries++) {
      try {
        code = await this.provider.getCode(address);
        break; // exit the loop if successful
      } catch (err) {
        if (tries === 2) {
          throw err; // throw the error if maximum tries reached
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const isEoa = code === "0x";
    this.eoaCache.set(address, isEoa);
    return isEoa;
  };
}
