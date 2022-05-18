import { Contract, providers, BigNumber } from "ethers";
import { APESWAP_INTERFACE } from "./utils";
import LRU from "lru-cache";
import NetworkData from "./network";
import {GNANA_TOKEN_CONTRACT} from "./utils"

export default class DataFetcher {
  provider: providers.Provider;    
  private cache: LRU<string, BigNumber>;
  gnanaContract: Contract;
  private networkManager: NetworkData;

  constructor(provider: providers.Provider, networkManager: NetworkData) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({ max: 10000 });
    this.networkManager = networkManager;  
    this.gnanaContract = new Contract(this.networkManager.gnana, APESWAP_INTERFACE, this.provider);    
  }

  public setGnanaContract() {    
    if (this.gnanaContract.address != this.networkManager.gnana) {      
      this.gnanaContract = new Contract(this.networkManager.gnana, APESWAP_INTERFACE, this.provider);  
    }
  }
  // return the number of tokens held by the account
  public async getBalance(account: string, blockNumber: number): Promise<BigNumber> {
    const key: string = `${account}-${blockNumber}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const balance: BigNumber = await this.gnanaContract.balanceOf(account, {
      blockTag: blockNumber,
    });
    this.cache.set(key, balance);
    return balance;
  }
}
