import { Contract, providers, BigNumber } from "ethers";
import { flexaInterface } from "./abi";

export default class DataFetcher {
  readonly flexaAddress: string;
  readonly provider: providers.Provider;
  private flexaContract: Contract;

  constructor(flexaAddress: string, provider: providers.Provider) {
    this.flexaAddress = flexaAddress;
    this.provider = provider;
    this.flexaContract = new Contract(flexaAddress, flexaInterface, provider);
  }

  public async getFallbackSetDate(blockNumber: number): Promise<BigNumber> {
    const fallbackSetDate: BigNumber = await this.flexaContract.fallbackSetDate({ blockTag: blockNumber });
    return BigNumber.from(fallbackSetDate);
  }

  public async getFallbackWithdrawalDelaySeconds(blockNumber: number): Promise<BigNumber> {
    const fallbackWithdrawalDelaySeconds: BigNumber = await this.flexaContract.fallbackWithdrawalDelaySeconds({
      blockTag: blockNumber
    });
    return BigNumber.from(fallbackWithdrawalDelaySeconds);
  }

  public async getPreviousBlockTimestamp(blockNumber: number): Promise<number> {
    const previousBlockTimestamp = (await this.provider.getBlock(blockNumber - 1)).timestamp;
    return previousBlockTimestamp;
  }
}
