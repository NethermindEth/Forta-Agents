import { Contract, providers, BigNumber } from "ethers";
import { flexaInterface } from "./abi";

export default class DataFetcher {
  readonly moduleAddress: string;
  readonly provider: providers.Provider;

  constructor(moduleAddress: string, provider: providers.Provider) {
    this.moduleAddress = moduleAddress;
    this.provider = provider;
  }

  public async getFallbackSetDate(blockNumber: number, flexaAddress: string): Promise<BigNumber> {
    const flexaContract: Contract = new Contract(flexaAddress, flexaInterface, this.provider);
    const fallbackSetDate: BigNumber = await flexaContract.fallbackSetDate({ blockTag: blockNumber });
    return BigNumber.from(fallbackSetDate);
  }

  public async getFallbackWithdrawalDelaySeconds(blockNumber: number, flexaAddress: string): Promise<BigNumber> {
    const flexaContract: Contract = new Contract(flexaAddress, flexaInterface, this.provider);
    const fallbackWithdrawalDelaySeconds: BigNumber = await flexaContract.fallbackWithdrawalDelaySeconds({
      blockTag: blockNumber
    });
    return BigNumber.from(fallbackWithdrawalDelaySeconds);
  }

  public async getPreviousBlockTimestamp(blockNumber: number): Promise<number> {
    const previousBlockTimestamp = (await this.provider.getBlock(blockNumber - 1)).timestamp;
    return previousBlockTimestamp;
  }
}
