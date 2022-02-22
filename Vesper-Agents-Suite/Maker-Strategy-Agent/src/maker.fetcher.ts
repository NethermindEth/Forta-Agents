import Web3 from "web3";
import LRU from "lru-cache";
import { isZeroAddress } from "ethereumjs-util";
import {
  Accountant_ABI,
  V2POOL_ABI,
  CONTROLLER_ABI,
  PoolABI,
  Strategy_ABI
} from "./abi";
const axios = require('axios')
const apiUrl = 'https://api.vesper.finance/dashboard?version=2'
const status = 'operative'
const allowedStages = ['prod', 'beta', 'orbit']

type blockNumber = string | number;
type strategies = string[];

export default class MakerFetcher {
  private cache: LRU<blockNumber, strategies>;
  private web3: Web3;

  constructor(web3: Web3) {
    this.cache = new LRU<blockNumber, strategies>({ max: 10_000 });
    this.web3 = web3;
  }

  private getPools = async () => {
    const list = await axios
      .get(apiUrl)
      .then((response: { data: { pools: any[]; }; }) => {
        return {
          v2:
            response.data.pools
              .filter((pool: { status: string; stage: string; contract: { version: any }; }) => {
                return pool.status === status && allowedStages.includes(pool.stage) && pool.contract.version.includes("2.x")
              })
              .map(pool => pool.contract.address)
          ,
          v3: response.data.pools
            .filter((pool: { status: string; stage: string; contract: { version: any }; }) => {
              return pool.status === status && allowedStages.includes(pool.stage) && !pool.contract.version.includes("2.x")
            })
            .map(pool => pool.contract.address)

        }
      })
    return list
  }

  private getPromise = (pool: string, blockNumber: string | number) => {
    const contract = new this.web3.eth.Contract(PoolABI, pool);
    return new Promise((resolve, reject) => {
      resolve(contract.methods.poolAccountant().call({}, blockNumber));
    });
  };

  private getPoolAccountants = async (
    blockNumber: string | number,
    pools: string[],
  ): Promise<string[]> => {
    const poolAccountants: string[] = [];

    const poolAccountantCalls = pools.map((pool) => {
      return this.getPromise(pool, blockNumber).catch(() => { });
    });

    await Promise.all(poolAccountantCalls).then((res) => {
      res.forEach((poolAccountant: any) => {
        if (poolAccountant && !isZeroAddress(poolAccountant)) {
          poolAccountants.push(poolAccountant);
        }
      });
    });

    return poolAccountants;
  };

  private getV2Strategies = async (
    blockNumber: string | number,
    pools: string[],
  ): Promise<string[]> => {
    let v2Strategies: string[] = [];
    const v2StrategyCalls = pools.map(async (pool) => {
      const poolV2Contract = new this.web3.eth.Contract(
        V2POOL_ABI,
        pool
      );
      const controller = await poolV2Contract.methods.controller().call()
      const controllerContract = new this.web3.eth.Contract(
        CONTROLLER_ABI,
        controller
      );
      return controllerContract.methods.strategy(pool).call({}, blockNumber);
    });

    await Promise.all(v2StrategyCalls).then((res) => {
      res.forEach((strategy) => {
        if (!isZeroAddress(strategy)) {
          v2Strategies.push(strategy);
        }
      });
    });

    return v2Strategies;
  };

  private getV3Strategies = async (
    blockNumber: string | number,
    pools: string[],
  ) => {
    let v3Strategies: string[] = [];

    const poolAccountants: string[] = await this.getPoolAccountants(
      blockNumber,
      pools,
    );

    const v3StrategyCalls = poolAccountants.map((accountant) => {
      return new this.web3.eth.Contract(Accountant_ABI, accountant).methods
        .getStrategies()
        .call({}, blockNumber);
    });

    try {
      await Promise.all(v3StrategyCalls).then((res) => {
        res.forEach((strategy) => {
          if (!isZeroAddress(strategy)) {
            v3Strategies.push(...strategy);
          }
        });
      });
    } catch { }

    return v3Strategies;
  };

  public getMakerStrategies = async (
    blockNumber: string | number
  ): Promise<string[]> => {
    if (blockNumber != "latest" && this.cache.get(blockNumber) !== undefined)
      return this.cache.get(blockNumber) as string[];
    const pools = await this.getPools()
    const v2Pools: string[] = pools.v2;
    const v3Pools: string[] = pools.v3;

    let [V2, V3] = await Promise.all([
      this.getV2Strategies(blockNumber, v2Pools),
      this.getV3Strategies(blockNumber, v3Pools)
    ]);

    V2 = Array.from(new Set<string>(V2));
    V3 = Array.from(new Set<string>(V3));

    const valueV2promise = V2.map(async (strat: string) => {
      const sContract = new this.web3.eth.Contract(
        Strategy_ABI,
        strat,
      );
      const name: string = await sContract.methods.NAME().call({}, blockNumber);
      if (!name.includes("Maker")) return BigInt(0);
      return BigInt(await sContract.methods.totalLocked().call({}, blockNumber));
    });

    const valueV3promise = V3.map(async (strat: string) => {
      const sContract = new this.web3.eth.Contract(
        Strategy_ABI,
        strat,
      );
      const name: string = await sContract.methods.NAME().call({}, blockNumber);
      if (!name.includes("Maker")) return BigInt(0);
      return BigInt(await sContract.methods.totalValue().call({}, blockNumber));
    });

    const allValue = (await Promise.all([
      valueV2promise,
      valueV3promise,
    ].flat()));

    const allStrat: string[] = V2.concat(V3);

    const makerValidStrat: string[] = allStrat.filter(
      (_: string, idx: number) => allValue[idx] > BigInt(0),
    );

    this.cache.set(blockNumber, makerValidStrat);
    return makerValidStrat;
  };
}
