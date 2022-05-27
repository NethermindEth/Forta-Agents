import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { SUPPLY_ABI } from "./utils";

export default class StakeFetcher {
  private provider: providers.Provider;
  private cache: LRU<string, BigNumber>;
  tokenAddress: string;
  tokenContract: Contract;

  constructor(provider: providers.Provider, tokenAddress: string) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({ max: 10000 });
    this.tokenAddress = tokenAddress;
    this.tokenContract = new Contract(tokenAddress, SUPPLY_ABI, this.provider);
  }

  public async getTotalSupply(block: number | string): Promise<BigNumber> {
    const key: string = `${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const totalSupply = await this.tokenContract.totalSupply({
      blockTag: block,
    });
    this.cache.set(key, totalSupply);

    return totalSupply;
  }
}
