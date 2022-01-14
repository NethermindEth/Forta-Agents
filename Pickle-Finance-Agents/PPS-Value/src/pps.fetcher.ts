import { Contract, providers, BigNumber } from "ethers";
import utils from "./utils";
import LRU from "lru-cache";

export default class PPSFetcher {
  private provider: providers.Provider;
  private cache: LRU<string, BigNumber>;

  constructor(provider: providers.Provider){
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({max: 10000});
  }

  public async getPPS(block: number, vault: string): Promise<BigNumber> {
    const key: string = `${vault}-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as BigNumber;

    const contract: Contract = new Contract(vault, utils.VAULT_ABI, this.provider);
    const ratio: BigNumber = await contract.getRatio({ blockTag: block });
    this.cache.set(key, ratio);
    return ratio;
  }
};
