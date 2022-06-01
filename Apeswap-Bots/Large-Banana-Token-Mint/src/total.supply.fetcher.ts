import { BigNumber, Contract, providers } from "ethers";
import LRU from "lru-cache";
import NetworkData from "./network";
import { BANANA_CONSTANTS } from "./constants";

const { BANANA_TOTAL_SUPPLY_ABI } = BANANA_CONSTANTS;

export default class TotalSupplyFetcher {
  provider: providers.Provider;
  private networkManager: NetworkData;
  bananaContract: Contract;
  private cache: LRU<string, BigNumber>;

  constructor(provider: providers.Provider, networkManager: NetworkData) {
    this.provider = provider;
    this.networkManager = networkManager;
    this.bananaContract = new Contract(networkManager.bananaAddress, BANANA_TOTAL_SUPPLY_ABI, provider);
    this.cache = new LRU<string, BigNumber>({ max: 10000 });
  }

  public setBananaContract() {
    if (this.bananaContract.address != this.networkManager.bananaAddress) {
      this.bananaContract = new Contract(this.networkManager.bananaAddress, BANANA_TOTAL_SUPPLY_ABI, this.provider);
    }
  }

  public async getTotalSupply(block: number): Promise<BigNumber> {
    const key: string = `-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const totalSupply: BigNumber = await this.bananaContract.totalSupply({
      blockTag: block,
    });
    this.cache.set(key, totalSupply);
    return totalSupply;
  }
}
