import LRU from "lru-cache";
import { providers, Contract } from "ethers";
import { TOKEN_IFACE } from "./utils";
import NetworkManager from "./network";

type key = {
  block: number;
  token: string;
};

export default class TokenBalanceHelper {
  readonly provider: providers.Provider;
  private cache: LRU<key, any>;
  private networkManager: NetworkManager;

  constructor(provider: providers.Provider, networkManager: NetworkManager) {
    this.provider = provider;
    this.cache = new LRU<key, any>({
      max: 10000,
    });
    this.networkManager = networkManager;
  }

  public async getBalanceOf(blockNum: number, l1Token: string): Promise<any> {
    const token = new Contract(l1Token, TOKEN_IFACE, this.provider);

    const key: key = { block: blockNum, token: l1Token };
    const oldKey: key = { block: blockNum - 1, token: l1Token };

    if (this.cache.get(oldKey) === undefined) {
      let prevBal;
      try {
        prevBal = await token.balanceOf(this.networkManager.hubPoolAddress, { blockTag: blockNum - 1 });
      } catch (e) {
        console.error(e);
      }

      this.cache.set(oldKey, prevBal);
    }

    if (this.cache.has(key)) return this.cache.get(key) as Promise<any>;

    let tokenBal;
    try {
      tokenBal = await token.balanceOf(this.networkManager.hubPoolAddress, { blockTag: blockNum });
    } catch (e) {
      console.error(e);
    }

    this.cache.set(key, tokenBal);

    return [this.cache.get(oldKey), this.cache.get(key)] as const;
  }
}
