import { Contract, BigNumber, providers } from "ethers";
import { QI_TOKENS_ABI } from "./utils";
import LRU from "lru-cache";
import { COMPTROLLER_IFACE } from "./utils";

export default class Fetcher {
  readonly provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber>>;
  private comptrollerContract: Contract;
  public markets: string[];

  constructor(provider: providers.Provider, _comptrollerContract: string) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber>>({ max: 10000 });
    this.markets = [];
    this.comptrollerContract = new Contract(_comptrollerContract, COMPTROLLER_IFACE, provider);
  }

  public async getMarkets(block?: string | number) {
    this.markets = await this.comptrollerContract.getAllMarkets({ blockTag: block });
  }

  public updateMarkets(marketAddress: string) {
    this.markets = [...this.markets, marketAddress];
  }
  public excludeMarkets(marketAddresses: string[]) {
    const updatedMarketsList: string[] = [...this.markets];

    marketAddresses.forEach((market) => {
      const index = updatedMarketsList.indexOf(market);
      if (index > -1) updatedMarketsList.splice(index, 1);
    });
    this.markets = updatedMarketsList;
  }

  public async getSupplyInterestRates(block: number, tokenAddress: string): Promise<BigNumber> {
    const key: string = `supply-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;
    const qiTokenContract = new Contract(tokenAddress, QI_TOKENS_ABI, this.provider);
    const supplyInterestRates: Promise<BigNumber> = qiTokenContract.supplyRatePerTimestamp({ blockTag: block });
    this.cache.set(key, supplyInterestRates);
    return supplyInterestRates;
  }

  public async getBorrowInterestRates(block: number, tokenAddress: string): Promise<BigNumber> {
    const key: string = `borrow-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;
    const qiTokenContract = new Contract(tokenAddress, QI_TOKENS_ABI, this.provider);
    const borrowInterestRates: Promise<BigNumber> = qiTokenContract.borrowRatePerTimestamp({ blockTag: block });
    this.cache.set(key, borrowInterestRates);
    return borrowInterestRates;
  }
}
