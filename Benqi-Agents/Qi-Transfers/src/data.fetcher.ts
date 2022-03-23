import { Contract, providers, BigNumber } from "ethers";
import { benqiInterface } from "./utils";

export default class DataFetcher {
  readonly qiTokenAddress: string;
  readonly provider: providers.Provider;
  private qiTokenContract: Contract;

  constructor(qiTokenAddress: string, provider: providers.Provider) {
    this.qiTokenAddress = qiTokenAddress;
    this.provider = provider;
    this.qiTokenContract = new Contract(qiTokenAddress, benqiInterface, provider);
  }

  // return the number of tokens held by the account
  public async getBalance(account: string, blockNumber: number): Promise<BigNumber> {
    const balance: BigNumber = await this.qiTokenContract.balanceOf(account, { blockTag: blockNumber });
    return balance;
  }
}
