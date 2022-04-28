import { providers, Contract, BigNumber } from "ethers";
import { IMPLEMENTATION_IFACE } from "./utils";

export default class BalanceFetcher {
  readonly provider: providers.Provider;
  readonly proxyAddress: string;

  constructor(provider: providers.Provider, proxyAddr: string) {
    this.provider = provider;
    this.proxyAddress = proxyAddr;
  }

  public async getTotalBorrowerDebtBalance(): Promise<BigNumber> {
    const balance: BigNumber = BigNumber.from(
      await this.provider.call({
        to: this.proxyAddress,
        data: IMPLEMENTATION_IFACE.getSighash("getTotalBorrowerDebtBalance"),
      }, "latest")
    );
    return balance;
  }

  public async getTotalActiveBalanceCurrentEpoch(): Promise<BigNumber> {
    const balance: BigNumber = BigNumber.from(
      await this.provider.call({
        to: this.proxyAddress,
        data: IMPLEMENTATION_IFACE.getSighash("getTotalActiveBalanceCurrentEpoch"),
      }, "latest")
    );
    return balance;
  }
}
