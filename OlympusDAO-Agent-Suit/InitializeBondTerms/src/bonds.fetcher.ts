import { 
  Contract, 
  providers, 
  utils as ethers, 
  BigNumber,
} from "ethers";
import utils from "./utils";
import LRU from "lru-cache";

export default class BondsFetcher {
  private provider: providers.Provider;
  readonly redeemHelper: string;
  private rhContract: Contract;
  private cache: LRU<number, Promise<string[]>>;

  constructor(redeemHelper: string, provider: providers.Provider) {
    this.provider = provider;
    this.redeemHelper = redeemHelper;
    this.rhContract = new Contract(redeemHelper, utils.REDEEM_HELPER_IFACE, provider);
    this.cache = new LRU<number, Promise<string[]>>({ max: 10000 });
  }

  public async getBondsContracts(block: number): Promise<string[]> {
    if (!this.cache.has(block)) {
      const getBondPromises: Promise<string>[] = [];

      // get bonds amount from storage
      const lengthEncoded = await this.provider.getStorageAt(
        this.redeemHelper,
        2,
        block,
      );
      const length = ethers.defaultAbiCoder.decode(["uint256"], lengthEncoded)[0];

      // fetch all the bonds
      for (let i = BigNumber.from(0); i.lt(length); i = i.add(1)) {
        getBondPromises.push(
          this.rhContract
            .bonds(i, { blockTag: block })
            .then((addr: string) => addr.toLowerCase()),
        );
      }
  
      this.cache.set(block, Promise.all(getBondPromises));
    }
    return this.cache.get(block) as Promise<string[]>;
  }
};
