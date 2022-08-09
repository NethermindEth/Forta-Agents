import { Contract, BigNumber, providers } from "ethers";
import { getPancakePairCreate2Address } from "./utils";
import { ERC20ABI, PANCAKE_PAIR_ABI } from "./constants";
import LRU from "lru-cache";

export default class DataFetcher {
  private provider: providers.Provider;
  private cache: LRU<string, [boolean, string, string] | BigNumber>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, [boolean, string, string] | BigNumber>({ max: 10000 });
  }

  public async isValidPancakePair(
    pairAddress: string,
    block: number,
    pancakeFactoryAddr: string,
    init: string
  ): Promise<[boolean, string, string]> {
    const key: string = `pool-${pairAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as [boolean, string, string];
    const pairContract = new Contract(pairAddress, PANCAKE_PAIR_ABI, this.provider);
    let token0Address: string, token1Address: string;
    try {
      [token0Address, token1Address] = await Promise.all([
        pairContract.token0({ blockTag: block }),
        pairContract.token1({ blockTag: block }),
      ]);
    } catch {
      return [false, "", ""];
    }
    const tokenPair = getPancakePairCreate2Address(pancakeFactoryAddr, token0Address, token1Address, init);
    const isValid = tokenPair.toLowerCase() === pairAddress.toLowerCase() ? true : false;
    this.cache.set(key, [isValid, token0Address.toLowerCase(), token1Address.toLowerCase()]);
    return [isValid, token0Address.toLowerCase(), token1Address.toLowerCase()];
  }

  public async getERC20Balance(tokenAddress: string, pairAddress: string, blockNumber: number): Promise<BigNumber> {
    const key: string = `poolBalance-${pairAddress}-${tokenAddress}-${blockNumber}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;
    const tokenContract = new Contract(tokenAddress, ERC20ABI, this.provider);
    let balance: BigNumber;
    try {
      balance = BigNumber.from(await tokenContract.balanceOf(pairAddress, { blockTag: blockNumber }));
    } catch {
      return BigNumber.from("0");
    }
    this.cache.set(key, balance);
    return balance;
  }
}
