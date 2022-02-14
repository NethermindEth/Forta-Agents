import { BigNumberish, Contract, providers, utils } from "ethers";
import LRU from "lru-cache";  
import abi from "./abi";

type ResultType = Promise<string[] | string>;

export default class DataFetcher {
  readonly registry: string;
  private rContract: Contract;
  readonly provider: providers.Provider;
  private cache: LRU<string, ResultType>;

  constructor(registry: string, provider: providers.Provider) {
    this.registry = registry;
    this.provider = provider;
    this.rContract = new Contract(registry, abi.REGISTRY, provider);
    this.cache = new LRU<string, ResultType>({max: 10000});
  }

  public async getUpkeep(block: number, id: BigNumberish): Promise<string> {
    const key: string = `${block}-${id.toString()}`;
    if(this.cache.has(key))
      return this.cache.get(key) as Promise<string>;

    const address: Promise<string> = this.rContract
      .getUpkeep(id, { blockTag: block })
      .then((result: any) => result.target.toLowerCase());
    this.cache.set(key, address);
    return address;
  }

  public async getStrategies(block: number, keeper: string): Promise<string[]> {
    const key: string = `${block}-${keeper}`;
    if(this.cache.has(key))
      return this.cache.get(key) as Promise<string[]>;

    const kContract: Contract = new Contract(keeper, abi.KEEPER, this.provider);
    const encodedLength: string = await this.provider.getStorageAt(keeper, 0, block);
    const length: number = utils.defaultAbiCoder.decode(['uint256'], encodedLength)[0];

    const strategiesPromises: Promise<string>[] = [];
    for (let i = 0; i < length; ++i){
      strategiesPromises.push(
        kContract
          .strategyArray(i, { blockTag: block })
          .then((strat: string) => strat.toLowerCase())
      )
    }
    const strategies: Promise<string[]> = Promise.all(strategiesPromises);
    this.cache.set(key, strategies);
    return strategies;
  }
};
