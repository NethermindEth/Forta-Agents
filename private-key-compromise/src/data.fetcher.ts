import { providers, Contract } from "ethers";
import { Interface } from "ethers/lib/utils";
import LRU from "lru-cache";
import { SYMBOL_ABI } from "./utils";

export default class DataFetcher {
  readonly provider: providers.Provider;
  private eoaCache: LRU<string, boolean>;
  private symbolCache: LRU<string, string>;
  private tokenContract: Contract;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.eoaCache = new LRU<string, boolean>({ max: 10000 });
    this.symbolCache = new LRU<string, string>({ max: 10000 });
    this.tokenContract = new Contract("", new Interface(SYMBOL_ABI), this.provider);
  }

  isEoa = async (address: string) => {
    if (this.eoaCache.has(address)) return this.eoaCache.get(address) as boolean;
    let code;

    for (let tries = 0; tries < 3; tries++) {
      try {
        code = await this.provider.getCode(address);
        break; // exit the loop if successful
      } catch (err) {
        if (tries === 2) {
          throw err; // throw the error if maximum tries reached
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const isEoa = code === "0x";
    this.eoaCache.set(address, isEoa);
    return isEoa;
  };

  public async getSymbol(tokenAddress: string, block: number): Promise<string> {
    if (this.symbolCache.has(tokenAddress)) return this.symbolCache.get(tokenAddress) as string;

    const token = this.tokenContract.attach(tokenAddress);

    const symbol = (
      await token.symbol({
        blockTag: block,
      })
    ).toLowerCase();

    this.symbolCache.set(tokenAddress, symbol);

    return symbol;
  }
}
