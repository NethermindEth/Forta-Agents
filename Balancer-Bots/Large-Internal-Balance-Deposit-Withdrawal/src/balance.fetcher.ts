import { providers, Contract, BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import LRU from "lru-cache";
import { TOKEN_ABI } from "./constants";

export default class BalanceFetcher {
  provider: providers.Provider;
  private cache: LRU<string, BigNumber>;
  tokenAddress: string;
  private tokenContract: Contract;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({
      max: 10000,
    });
    this.tokenAddress = "";
    this.tokenContract = new Contract(this.tokenAddress, new Interface(TOKEN_ABI), this.provider);
  }

  // Function to initialize fetcher data, called once during the bot initialization.
  public setData(_tokenAddress: string) {
    this.tokenAddress = _tokenAddress;
    if (this.tokenContract.address != this.tokenAddress)
      this.tokenContract = new Contract(this.tokenAddress, new Interface(TOKEN_ABI), this.provider);
  }

  // Main function to fetch the contract balance.
  public async getBalance(block: number | string, vaultAddress: string): Promise<BigNumber> {
    const key: string = `${this.tokenAddress} - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const balance: BigNumber = await this.tokenContract.balanceOf(vaultAddress, {
      blockTag: block,
    });

    this.cache.set(key, balance);

    return balance;
  }
}
