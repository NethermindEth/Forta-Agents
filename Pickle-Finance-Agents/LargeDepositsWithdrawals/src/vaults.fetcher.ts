import { Contract, providers, BigNumber } from "ethers";
import abi from "./abi";
import LRU from "lru-cache";

export default class VaultsFetcher {
  readonly registry: string;
  private rContract: Contract;
  private provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber | Set<string>>>;

  constructor(registry: string, provider: providers.Provider){
    this.provider = provider;
    this.registry = registry;
    this.rContract = new Contract(registry, abi.REGISTRY, provider);
    this.cache = new LRU<string, Promise<BigNumber | Set<string>>>({max: 10000});
  }

  private async getDevVaults(block: number): Promise<string[]> {
    return this.rContract.developmentVaults({ blockTag: block });
  }

  private async getProdVaults(block: number): Promise<string[]> {
    return this.rContract.productionVaults({ blockTag: block });
  }

  public async getVaults(block: number): Promise<Set<string>> {
    const key: string = `all-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as Promise<Set<string>>;

    const vaultsPromise: Promise<Set<string>> = Promise.all([
      this.getDevVaults(block),
      this.getProdVaults(block),
    ]).then(vaults => new Set<string>(
      vaults.flat().map(v => v.toLowerCase())
    ));
    this.cache.set(key, vaultsPromise);
    return vaultsPromise;
  }

  public async getSupply(block: number, vault: string): Promise<BigNumber> {
    const key: string = `${vault}-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as Promise<BigNumber>;

    const contract: Contract = new Contract(vault, abi.VAULT, this.provider);
    const supply: Promise<BigNumber> = contract.totalSupply({ blockTag: block });
    this.cache.set(key, supply);
    return supply;
  }
};