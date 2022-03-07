import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { PRICE_ABI } from "./utils";

export type Reponse = [
  //response struct
  roundId: BigNumber,
  answer: BigNumber,
  startedAt: BigNumber,
  updatedAt: BigNumber,
  answeredInRound: BigNumber
];
export default class PriceFetcher {
  private provider: providers.Provider;
  private cache: LRU<string, Promise<Reponse | Set<string>>>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<Reponse | Set<string>>>({
      max: 10000,
    });
  }

  public async getAmpPrice(
    block: number | string,
    contract: string
  ): Promise<Reponse> {
    const key: string = `${block} - ${contract}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<Reponse>;
    const priceFeedContract = new Contract(contract, PRICE_ABI, this.provider);
    const ampPrice: Promise<Reponse> = priceFeedContract.latestRoundData({
      blockTag: block,
    });
    this.cache.set(key, ampPrice);
    return ampPrice;
  }
}
