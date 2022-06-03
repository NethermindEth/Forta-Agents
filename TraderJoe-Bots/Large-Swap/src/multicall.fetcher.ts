import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { MULTICALL_IFACE, PAIR_IFACE } from "./utils";

export default class MulticallFetcher {
  readonly multicallAddress: string;
  private multicallContract: Contract;
  private cache: LRU<string, boolean>;

  constructor(multicall: string, provider: providers.Provider /*, signer: providers.JsonRpcSigner*/) {
    this.multicallAddress = multicall;
    this.multicallContract = new Contract(multicall, MULTICALL_IFACE, provider) /*.connect(signer)*/;
    this.cache = new LRU<string, boolean>({ max: 10000 });
  }

  public async aggregate(calls: any, block: string | number): Promise<string[]> {
    // NOTE: UPDATE HOW KEY IS GENERATED
    const key: string = `token0 - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<string[]>;

    const returnData = await this.multicallContract.aggregate(calls, { blockTag: block });
    // this.cache.set(key, returnData);
    return returnData;
  }
}
