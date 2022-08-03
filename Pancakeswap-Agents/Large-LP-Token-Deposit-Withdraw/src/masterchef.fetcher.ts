import { providers, Contract } from "ethers";
import LRU from "lru-cache";
import { MASTERCHEF_ABI } from "./constants";

export default class MasterchefFetcher {
  readonly provider: providers.Provider;
  private cache: LRU<string, string>;
  private masterchefContract: Contract;

  constructor(provider: providers.Provider, masterchefAddress: string) {
    this.provider = provider;
    this.cache = new LRU<string, string>({
      max: 1000,
    });
    this.masterchefContract = new Contract(masterchefAddress, MASTERCHEF_ABI, provider);
  }

  public async getLPToken(pid: string | number, block: string | number) {
    const key: string = `${pid}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as string;
    const lpToken: string = await this.masterchefContract.lpToken(pid, { blockTag: block });
    this.cache.set(key, lpToken);
    return lpToken;
  }
}
