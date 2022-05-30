import { providers, Contract, BigNumberish } from "ethers";
import LRU from "lru-cache";
import abi from "./abi";

interface Reserves {
  reserve0: BigNumberish;
  reserve1: BigNumberish;
}

export default class PairFetcher {
  readonly factoryAddress: string;
  private factoryContract: Contract;
  private provider: providers.Provider;
  private cache: LRU<string, boolean | Reserves>;

  constructor(factory: string, provider: providers.Provider) {
    this.provider = provider;
    this.factoryAddress = factory;
    this.factoryContract = new Contract(factory, abi.FACTORY, provider);
    this.cache = new LRU<string, boolean>({ max: 10000 });
  }

  public async isImpossiblePair(block: number | string, pair: string): Promise<boolean> {
    const key: string = `is-${block}-${pair}`;
    if (this.cache.has(key)) return this.cache.get(key) as boolean;

    try {
      const pairContract: Contract = new Contract(pair, abi.PAIR, this.provider);
      const [token0, token1] = await Promise.all([
        pairContract.token0({ blockTag: block }),
        pairContract.token1({ blockTag: block }),
      ]);
      const realPair: string = await this.factoryContract.getPair(token0, token1, { blockTag: block });
      const isCorrectPair: boolean = realPair.toLowerCase() === pair.toLowerCase();
      this.cache.set(key, isCorrectPair);
      return isCorrectPair;
    } catch {
      this.cache.set(key, false);
      return false;
    }
  }

  public async getReserves(block: number | string, pair: string): Promise<Reserves> {
    const key: string = `reserve-${block}-${pair}`;
    if (this.cache.has(key)) return this.cache.get(key) as Reserves;
    const pContract = new Contract(pair, abi.PAIR, this.provider);
    const [ reserve0, reserve1 ] = await pContract.getReserves({ blockTag: block });
    
    this.cache.set(key, { reserve0, reserve1 });
    return { reserve0, reserve1 };
  }
}
