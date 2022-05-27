import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { SUPPLY_ABI } from "./utils";

export default class StakeFetcher {
  private provider: providers.Provider;
  private cache: LRU<string, BigNumber>;
  stakingAddress:string;
  stakingContract: Contract ;

  constructor(provider: providers.Provider, stakingAddress: string) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({ max: 10000 });
    this.stakingAddress = stakingAddress;
    this.stakingContract = new Contract(stakingAddress, SUPPLY_ABI, this.provider);
  }

  public async getTotalSupply(
    contract: string,
    block: number | string
  ): Promise<BigNumber> {
    const key: string = `${block}-${contract}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const totalSupply = await this.stakingContract.totalSupply({
      blockTag: block,
    });
    this.cache.set(key, totalSupply);

    return totalSupply;
  }
}
