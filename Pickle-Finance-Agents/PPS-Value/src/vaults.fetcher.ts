import { Contract, providers, BigNumber } from "ethers";
import utils from "./abi";
import LRU from "lru-cache";

export default class VaultsFetcher {
  readonly registry: string;
  private rContract: Contract;
  private provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber | string[]>>;

  constructor(registry: string, provider: providers.Provider){
    this.provider = provider;
    this.registry = registry;
    this.rContract = new Contract(registry, utils.REGISTRY, provider);
    this.cache = new LRU<string, Promise<BigNumber | string[]>>({max: 10000});
  }

  private async getDevVaults(block: number): Promise<string[]> {
    return this.rContract.developmentVaults({ blockTag: block });
  }

  private async getProdVaults(block: number): Promise<string[]> {
    return this.rContract.productionVaults({ blockTag: block });
  }

  public async getVaults(block: number): Promise<string[]> {
    const key: string = `all-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as Promise<string[]>;

    const vaultsPromise: Promise<string[]> = Promise.all([
      this.getDevVaults(block),
      this.getProdVaults(block),
    ]).then(vaults => vaults
      .flat()
      .map(v => v.toLowerCase())
    );
    this.cache.set(key, vaultsPromise);
    return vaultsPromise;
  }

  public async getPPS(block: number, vault: string): Promise<BigNumber> {
    const key: string = `${vault}-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as Promise<BigNumber>;

    const contract: Contract = new Contract(vault, utils.VAULT, this.provider);
    const ratio: Promise<BigNumber> = contract.getRatio({ blockTag: block });
    this.cache.set(key, ratio);
    return ratio;
  }
};
