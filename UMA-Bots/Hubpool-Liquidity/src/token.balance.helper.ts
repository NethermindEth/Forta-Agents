import LRU from "lru-cache";
import { providers, Contract } from "ethers";
import { TOKEN_IFACE } from "./utils";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData } from "./network";

export type currentCycle = {
  cycleTimestamp: number;
  initialAmount: number,
  newAmount: number,
  amountRemoved: number,
  percentChanged: number
}

export default class TokenBalanceHelper {
  readonly provider: providers.Provider;
  private networkManager: NetworkManager<NetworkData>;

  constructor(provider: providers.Provider, networkManager: NetworkManager<NetworkData>) {
    this.provider = provider;
    this.networkManager = networkManager;
  }

  public async getBalance(l1Token: string, blockNum: number): Promise<any> {
    const token = new Contract(l1Token, TOKEN_IFACE, this.provider);
    let newBal, oldBal, timestamp;

    try {
      oldBal = await token.balanceOf(this.networkManager.get("hubPoolAddress"), { blockTag: blockNum - 1  });
      timestamp = await (await this.provider.getBlock(blockNum - 1)).timestamp
    } catch (e) {
      console.error(e);
    }

    try {
      newBal = await token.balanceOf(this.networkManager.get("hubPoolAddress"), { blockTag: blockNum });
    } catch (e) {
      console.error(e);
    }

    return [oldBal, newBal, timestamp] as const;
  }

  public async getCurrentCycle(l1Token: string, blockNum: number, lruCache: LRU<string, currentCycle>): Promise<any>{    
    const [oldBal,, timestamp] = await this.getBalance(l1Token, blockNum);

    if (lruCache.get(l1Token.toLocaleLowerCase()) === undefined) {
      const startCycle: currentCycle = {
        cycleTimestamp: timestamp,
        initialAmount: oldBal,
        newAmount: oldBal,
        amountRemoved: 0,
        percentChanged: 0,
      }
      lruCache.set(l1Token.toLocaleLowerCase(), startCycle);
    }

    return lruCache.get(l1Token.toLocaleLowerCase()) as Promise<any>;
  }

  public async startNewCycle(l1Token: string, blockNum: number, timestamp: number, lruCache: LRU<string, currentCycle>){
    const [, newBal] = await this.getBalance(l1Token, blockNum);

    const newCycle: currentCycle = {
      cycleTimestamp: timestamp,
      initialAmount: newBal,
      newAmount: newBal,
      amountRemoved: 0,
      percentChanged: 0,
    }

    lruCache.set(l1Token.toLocaleLowerCase(), newCycle);
  }
  
  public async calculateChange(l1Token: string, blockNum: number, lruCache: LRU<string, currentCycle>): Promise<any>{
    const [, newBal] = await this.getBalance(l1Token, blockNum);
    const currentCycle = lruCache.get(l1Token.toLocaleLowerCase()) as currentCycle;
    const percentChange = (currentCycle.initialAmount - newBal)/currentCycle.initialAmount;

    const updateCycle: currentCycle = {
      cycleTimestamp: currentCycle.cycleTimestamp,
      initialAmount: currentCycle.initialAmount,
      newAmount: newBal,
      amountRemoved: currentCycle.initialAmount - newBal,
      percentChanged: percentChange,
    }

    lruCache.set(l1Token.toLocaleLowerCase(), updateCycle);

    return lruCache.get(l1Token.toLocaleLowerCase()) as Promise<any>;
  }
}
