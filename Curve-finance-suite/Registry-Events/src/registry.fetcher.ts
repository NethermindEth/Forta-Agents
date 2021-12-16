import { Contract } from "ethers";
import LRU from "lru-cache";
import abi from "./abi";

export default class RegistryFetcher {
  readonly addrProvider: string;
  private adContract: Contract;
  private cache: LRU<number, string>;

  constructor(addrProvider: string, provider: any) {
    this.addrProvider = addrProvider;
    this.adContract = new Contract(addrProvider, abi.PROVIDER, provider);
    this.cache = new LRU<number, string>();
  }

  async getRegistry(blockTag: number): Promise<string> {
    if(this.cache.get(blockTag) !== undefined)
      return this.cache.get(blockTag) as string;
    
    const registry: string = (await this.adContract.get_registry({ blockTag })).toLowerCase();
    this.cache.set(blockTag, registry);
    return registry;
  }  
};
