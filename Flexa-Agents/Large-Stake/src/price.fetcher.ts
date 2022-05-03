import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import util from "./utils";

export type Response = [
  //response struct
  roundId: BigNumber,
  answer: BigNumber,
  startedAt: BigNumber,
  updatedAt: BigNumber,
  answeredInRound: BigNumber
];

export default class PriceFetcher {
  private provider: providers.Provider;
  private cache: LRU<string, Promise<Response>>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<Response>>({
      max: 10000,
    });
  }

  public async getAmpPrice(
    block: number | string,
    contract: string
  ): Promise<Response> {
    const key: string = `${block} - ${contract}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<Response>;
    const priceFeedContract = new Contract(contract, util.PRICE_ABI, this.provider);
    const ampPrice: Promise<Response> = priceFeedContract.latestRoundData({
      blockTag: block,
    });
    this.cache.set(key, ampPrice);
    return ampPrice;
  }
}