import { providers, Contract, BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import LRU from "lru-cache";
import { ERC20_ABI } from "./utils";

export default class BalanceFetcher {
  provider: providers.Provider;
  private cache: LRU<string, BigNumber | string>;
  private tokenContract: Contract;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber | string>({
      max: 10000,
    });
    this.tokenContract = new Contract("", new Interface(ERC20_ABI), this.provider);
  }

  // Main function to fetch the contract balance.
  public async getBalance(block: number | string, monitoredAddress: string, tokenAddress: string): Promise<BigNumber> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `${tokenAddress}-${monitoredAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const balance: BigNumber = await token.balanceOf(monitoredAddress, {
      blockTag: block,
    });

    this.cache.set(key, balance);

    return balance;
  }
}
