import { Contract } from "ethers";
import LRU from "lru-cache";
import abi from "./abi";

type Output = string | boolean;

export default class DataFetcher {
  readonly addrProvider: string;
  private apContract: Contract;
  private provider: any;
  private cache: LRU<string, Output>;

  constructor(address: string, provider: any) {
    this.addrProvider = address;
    this.provider = provider;
    this.cache = new LRU<string, Output>();
    this.apContract = new Contract(address, abi.PROVIDER_ABI, provider);
  }

  public async getRegistry(blockTag: string | number = "latest"): Promise<string> {
    const key: string = `registry-${blockTag}`;
    if(blockTag !== "latest" && this.cache.get(key) !== undefined)
      return this.cache.get(key) as string;

    const registry: string = (await this.apContract.get_registry({ blockTag })).toLowerCase();
    this.cache.set(key, registry);
    return registry;
  }

  public async isPool(address: string, blockTag: string | number = "latest"): Promise<boolean> {
    const key: string = `pool-${address}-${blockTag}`;
    if(blockTag !== "latest" && this.cache.get(key) !== undefined)
      return this.cache.get(key) as boolean;

    const registry: string = await this.getRegistry(blockTag);
    const rContract: Contract = new Contract(registry, abi.REGISTRY_IFACE, this.provider);
    const name: string = await rContract.get_pool_name(address, { blockTag });
    const validPool: boolean = name !== "";

    this.cache.set(key, validPool);
    return validPool;
  }
};
