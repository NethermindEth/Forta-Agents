import { Contract, providers } from "ethers";
import utils from "./utils";
import LRU from "lru-cache";

export default class Fetcher {
  readonly amp: string;
  readonly flexa: string;
  private flexaContract: Contract;
  private cache: LRU<string, Promise<boolean>>;

  constructor(amp: string, flexa: string, provider: providers.Provider){
      this.amp = amp;
      this.flexa = flexa;
      this.flexaContract = new Contract(flexa, utils.FLEXA_ABI, provider);
      this.cache = new LRU<string, Promise<boolean>>({max: 10000});
  }

  public async isPartition(block: number, partition: string): Promise<boolean> {
    const key: string = `is-${partition}-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as Promise<boolean>;
    const isPartition: Promise<boolean> = this.flexaContract.partitions(partition, { blockTag: block });
    this.cache.set(key, isPartition);
    return isPartition;
  }
}
