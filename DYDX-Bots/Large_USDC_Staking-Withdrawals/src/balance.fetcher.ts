import { providers, Contract } from "ethers";
import { USDC_IFACE } from "./utils";

export default class BalanceFetcher {
  readonly provider: providers.Provider;
  readonly stakeTokenAddress: string;
  private stakeTokenContract: Contract;

  constructor(provider: providers.Provider, tokenAddr: string) {
    this.provider = provider;
    this.stakeTokenAddress = tokenAddr;
    this.stakeTokenContract = new Contract(tokenAddr, USDC_IFACE, provider);
  }

  public async getBalanceOf(address: string, block: string | number): Promise<string> {
    const balance = await this.stakeTokenContract.balanceOf(address, { blockTag: block });
    return balance;
  }
}
