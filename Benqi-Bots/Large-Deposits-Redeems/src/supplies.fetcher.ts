import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { SUPPLIES_SIGNATURE } from "./utils";

export default class SuppliesFetcher {
  provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber>>;
  pglStakingAddress: string;
  private pglStakingContract: Contract;

  constructor(provider: providers.Provider, contractAddr: string) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber>>({
      max: 10000,
    });
    this.pglStakingAddress = contractAddr;
    this.pglStakingContract = new Contract(contractAddr, SUPPLIES_SIGNATURE, provider);
  }

  public async getTotalSupplies(block: number | string): Promise<BigNumber> {
    const key: string = `${this.pglStakingContract} - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;

    const supplies: Promise<BigNumber> = this.pglStakingContract.totalSupplies({
      blockTag: block,
    });
    this.cache.set(key, supplies);
    return supplies;
  }
}
