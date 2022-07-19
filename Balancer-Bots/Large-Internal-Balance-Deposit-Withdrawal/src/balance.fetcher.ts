import { providers, Contract, BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import LRU from "lru-cache";
import { TOKEN_ABI } from "./constants";

export default class BalanceFetcher {
  provider: providers.Provider;
  private balanceCache: LRU<string, BigNumber>;
  private symbolCache: LRU<string, string>;
  private tokenContract: Contract;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.balanceCache = new LRU<string, BigNumber>({
      max: 10000,
    });
    this.symbolCache = new LRU<string, string>({
      max: 10000,
    });
    this.tokenContract = new Contract("", new Interface(TOKEN_ABI), this.provider);
  }

  // Main function to fetch the contract balance.
  public async getBalance(block: number | string, vaultAddress: string, tokenAddress: string): Promise<BigNumber> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `${tokenAddress}-${block}`;
    if (this.balanceCache.has(key)) return this.balanceCache.get(key) as BigNumber;

    const balance: BigNumber = await token.balanceOf(vaultAddress, {
      blockTag: block,
    });

    this.balanceCache.set(key, balance);

    return balance;
  }

  public async getSymbol(block: number | string, tokenAddress: string): Promise<string> {
    const token = this.tokenContract.attach(tokenAddress);

    const key: string = `${tokenAddress}-${block}`;
    if (this.symbolCache.has(key)) return this.symbolCache.get(key) as string;

    const symbol: string = await token.symbol({
      blockTag: block,
    });

    this.symbolCache.set(key, symbol);

    return symbol;
  }
}
