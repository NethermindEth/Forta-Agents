import { Contract, BigNumber, providers } from "ethers";
import { QiTOKENS_ABI } from "./utils";
import LRU from "lru-cache";

export default class Fetcher {
  private provider: any;
  private cache: LRU<string, Promise<BigNumber>>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber>>({ max: 10000 });
  }

  public async getSupplyInterestRates(block: number, tokenAddress: string): Promise<BigNumber> {
    const key: string = `supply-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;
    const qiTokenContract = new Contract(tokenAddress, QiTOKENS_ABI, this.provider);
    const supplyInterestRates: Promise<BigNumber> = qiTokenContract.supplyRatePerTimestamp({ blockTag: block });
    this.cache.set(key, supplyInterestRates);
    return supplyInterestRates;
  }

  public async getBorrowInterestRates(block: number, tokenAddress: string): Promise<BigNumber> {
    const key: string = `borrow-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;
    const qiTokenContract = new Contract(tokenAddress, QiTOKENS_ABI, this.provider);
    const borrowInterestRates: Promise<BigNumber> = qiTokenContract.borrowRatePerTimestamp({ blockTag: block });
    this.cache.set(key, borrowInterestRates);
    return borrowInterestRates;
  }
}
