import { providers, Contract, BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import LRU from "lru-cache";
import { TOKEN_ABI } from "./constants";

export default class BalanceFetcher {
  provider: providers.Provider;
  private cache: LRU<string, BigNumber | string>;
  private tokenContract: Contract;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber | string>({
      max: 10000,
    });
    this.tokenContract = new Contract("", new Interface(TOKEN_ABI), this.provider);
  }

  // Main function to fetch the contract balance.
  public async getBalance(block: number | string, vaultAddress: string, tokenAddress: string): Promise<BigNumber> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const balance: BigNumber = await token.balanceOf(vaultAddress, {
      blockTag: block,
    });

    this.cache.set(key, balance);

    return balance;
  }

  public async getSymbol(block: number | string, tokenAddress: string): Promise<string> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `symbol-${tokenAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as string;

    const symbol: string = await token.symbol({
      blockTag: block,
    });

    this.cache.set(key, symbol);

    return symbol;
  }
}
