import { Contract, providers, BigNumber } from "ethers";
import { APESWAP_INTERFACE } from "./utils";
import LRU from "lru-cache";

export default class DataFetcher {
  readonly gnanaTokenAddress: string;
  readonly provider: providers.Provider;
  private apeswapTokenContract: Contract;
  private cache: LRU<string, BigNumber>;

  constructor(gnanaTokenAddress: string, provider: providers.Provider) {
    this.gnanaTokenAddress = gnanaTokenAddress;
    this.provider = provider;
    this.apeswapTokenContract = new Contract(
      gnanaTokenAddress,
      APESWAP_INTERFACE,
      provider
    );
    this.cache = new LRU<string, BigNumber>({ max: 10000 });
  }

  // return the number of tokens held by the account
  public async getBalance(
    account: string,
    blockNumber: number
  ): Promise<BigNumber> {
    const key: string = `${account}-${blockNumber}`;

    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const balance: BigNumber = await this.apeswapTokenContract.balanceOf(
      account,
      {
        blockTag: blockNumber,
      }
    );
    this.cache.set(key, balance);
    return balance;
  }
}
