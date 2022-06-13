import { providers, Contract } from "ethers";
import BigNumber from "bignumber.js";
import LRU from "lru-cache";
import { LATEST_ANSWER_ABI, ASSET_PRICE_ABI } from "./constants";
import { ethersBnToBn } from "./utils";

export default class PriceFetcher {
  private ethCache: LRU<string, BigNumber>;
  private assetCache: LRU<string, BigNumber>;
  readonly provider: providers.Provider;

  constructor(provider: providers.Provider) {
    this.ethCache = new LRU<string, BigNumber>({
      max: 10000,
    });
    this.assetCache = new LRU<string, BigNumber>({
      max: 10000,
    });
    this.provider = provider;
  }

  // return ETH price in USD
  public async getEthPrice(block: number | string, ethUsdFeedAddress: string): Promise<BigNumber> {
    const key: string = `${block}-${ethUsdFeedAddress}`;
    if (this.ethCache.has(key)) return this.ethCache.get(key) as Promise<BigNumber>;

    const ethUsdFeedcontract = new Contract(ethUsdFeedAddress, [LATEST_ANSWER_ABI], this.provider);
    const ethToUsd = ethersBnToBn(await ethUsdFeedcontract.latestAnswer({ blockTag: block }), 8);
    this.ethCache.set(key, ethToUsd);

    return ethToUsd;
  }

  // return asset price in ETH
  public async getAssetPrice(
    umeeOracleAddress: string,
    assetAddress: string,
    block: string | number
  ): Promise<BigNumber> {
    const key: string = `${block}-${assetAddress}`;
    if (this.assetCache.has(key)) return this.assetCache.get(key) as Promise<BigNumber>;

    const oracleContract = new Contract(umeeOracleAddress, [ASSET_PRICE_ABI], this.provider);

    const assetPrice = ethersBnToBn(
      await oracleContract.getAssetPrice(assetAddress, {
        blockTag: block,
      }),
      18
    );

    this.assetCache.set(key, assetPrice);

    return assetPrice;
  }
}
