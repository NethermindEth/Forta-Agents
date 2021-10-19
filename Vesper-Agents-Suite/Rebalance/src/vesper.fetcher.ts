import { createFetcher, Fetcher } from "./utils";
import { isZeroAddress } from "ethereumjs-util"
import abi from "./abi";

type BlockId = string | number;

export default class VesperFetcher{
  private web3Call: any;
  private controller: string;

  constructor(web3Call: any, controller: string){
    this.web3Call = web3Call;
    this.controller = controller;
  }

  public async getPools(block: BlockId = "latest"){
    const { poolsList } = await createFetcher(this.web3Call, this.controller, abi.POOLS)(block);
    const poolsListLower = poolsList.toLowerCase();
    const { length } = await createFetcher(this.web3Call, poolsListLower, abi.LENGHT)(block);
    
    const pools: string[] = [];
    const fetchAt: Fetcher = createFetcher(this.web3Call, poolsListLower, abi.AT);
    for(let i = 0; i < length; ++i){
      const { pool } = await fetchAt(block, i.toString());
      pools.push(pool.toLowerCase());
    }
    return pools;
  }

  private async _getStrategies(block: BlockId, fetchV3: boolean = true){
    const pools = await this.getPools(block);

    const V2: Set<string> = new Set<string>();
    const V3: Set<string> = new Set<string>();
    const fetchStrat = await createFetcher(this.web3Call, this.controller, abi.STRATEGY);
    for(let pool of pools){
      const { strategy } = await fetchStrat(block, pool);
      if(!isZeroAddress(strategy)){
        V2.add(strategy.toLowerCase());
      }
      else if(fetchV3) {
        const { strategiesList } = await createFetcher(this.web3Call, pool, abi.GET_STRATEGIES)(block);
        strategiesList.forEach((addr: string) => V3.add(addr.toLowerCase()));
      }
    }
    return { V2, V3 };
  }

  public async getStrategiesV2(block: BlockId = "latest"){
    const { V2 } = await this._getStrategies(block, false);
    return Array.from(V2);
  }

  public async getStrategiesV3(block: BlockId = "latest"){
    const { V3 } = await this._getStrategies(block);
    return Array.from(V3);
  }

  public async getAllStrategies(block: BlockId = "latest"){
    const { V2, V3 } = await this._getStrategies(block);
    V3.forEach(strat => V2.add(strat));
    return Array.from(V2);
  }
};
