import { providers, Contract, BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import LRU from "lru-cache";
import { ERC20_TOKEN_ABI } from "./utils";

export default class BalanceFetcher {
  provider: providers.Provider;
  private cache: LRU<string, BigNumber>;
  perpetualAddress: string;

  constructor(provider: providers.Provider, contractAddr: string) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({
      max: 10000,
    });
    this.perpetualAddress = contractAddr;
  }

  public async getBalance(token: string, block: number | string): Promise<BigNumber> {
    const key: string = `${token} - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const tokenContract = new Contract(token, new Interface(ERC20_TOKEN_ABI), this.provider);

    const balance: BigNumber = tokenContract.balanceOf(this.perpetualAddress, {
      blockTag: block,
    });
    this.cache.set(key, balance);
    return balance;
  }
}
