import { Contract, providers, BigNumber } from "ethers";
import { benqiInterface } from "./utils";
import LRU from "lru-cache";

export default class DataFetcher {
  readonly qiTokenAddress: string;
  readonly provider: providers.Provider;
  private qiTokenContract: Contract;
  private cache: LRU<string, BigNumber>;

  constructor(qiTokenAddress: string, provider: providers.Provider) {
    this.qiTokenAddress = qiTokenAddress;
    this.provider = provider;
    this.qiTokenContract = new Contract(qiTokenAddress, benqiInterface, provider);
    this.cache = new LRU<string, BigNumber>({ max: 10000 });
  }

  // return the number of tokens held by the account
  public async getBalance(account: string, blockNumber: number): Promise<BigNumber> {
    const key: string = `${account}-${blockNumber}`;

    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const balance: BigNumber = await this.qiTokenContract.balanceOf(account, { blockTag: blockNumber });
    this.cache.set(key, balance);
    return balance;
  }
}
