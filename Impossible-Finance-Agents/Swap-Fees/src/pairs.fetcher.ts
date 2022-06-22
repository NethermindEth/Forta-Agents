import { providers, Contract } from "ethers";
import LRU from "lru-cache";
import abi from "./abi";

export default class PairFetcher {
  readonly factoryAddress: string;
  private factoryContract: Contract;
  private provider: providers.Provider;
  private cache: LRU<string, boolean>;

  constructor(factory: string, provider: providers.Provider) {
    this.provider = provider;
    this.factoryAddress = factory;
    this.factoryContract = new Contract(factory, abi.FACTORY, provider);
    this.cache = new LRU<string, boolean>({ max: 10000 });
  }

  public async isImpossiblePair(block: number | string, pair: string): Promise<boolean> {
    const key: string = `${block}-${pair}`;
    if (this.cache.has(key)) return this.cache.get(key) as boolean;

    try {
      const pairContract: Contract = new Contract(pair, abi.PAIR, this.provider);
      const [token0, token1] = await Promise.all([
        pairContract.token0({ blockTag: block }),
        pairContract.token1({ blockTag: block }),
      ]);
      const realPair: string = await this.factoryContract.getPair(token0, token1, {
        blockTag: block,
      });
      const isCorrectPair: boolean = realPair.toLowerCase() === pair.toLowerCase();
      this.cache.set(key, isCorrectPair);
      return isCorrectPair;
    } catch {
      this.cache.set(key, false);
      return false;
    }
  }
}
