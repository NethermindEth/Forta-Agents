import Web3 from "web3";
import LRU from "lru-cache";
import { isZeroAddress } from "ethereumjs-util";
import {
  Accountant_ABI,
  AddressListABI,
  CONTROLLER_ABI,
  PoolABI,
  Strategy_ABI
} from "./abi";

type blockNumber = string | number;
type strategies = string[];

const CONTROLLER_CONTRACT = "0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217";

export default class MakerFetcher {
  private cache: LRU<blockNumber, strategies>;
  private web3: Web3;

  constructor(web3: Web3) {
    this.cache = new LRU<blockNumber, strategies>({ max: 10_000 });
    this.web3 = web3;
  }

  private getPools = async (
    blockNumber: string | number = "latest"
  ): Promise<string[]> => {
    const pools: string[] = [];
    const poolCalls = [];

    const controllerContract = new this.web3.eth.Contract(
      CONTROLLER_ABI,
      CONTROLLER_CONTRACT
    );
    const addressListAddress = await controllerContract.methods
      .pools()
      .call({}, blockNumber);

    const addressListContract = new this.web3.eth.Contract(
      AddressListABI,
      addressListAddress
    );
    const poolsLength: number = Number(
      await addressListContract.methods.length().call({}, blockNumber)
    );

    for (let i = 0; i < poolsLength; i++) {
      poolCalls.push(addressListContract.methods.at(i).call({}, blockNumber));
    }

    await Promise.all(poolCalls).then((res) => {
      res.forEach(([pool, _]) => {
        if (!isZeroAddress(pool)) {
          pools.push(pool);
        }
      });
    });

    return pools;
  };

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
      return this.getPromise(pool, blockNumber).catch(() => {});
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

    const controllerContract = new this.web3.eth.Contract(
      CONTROLLER_ABI,
      CONTROLLER_CONTRACT
    );

    const v2StrategyCalls = pools.map((pool) => {
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
    } catch {}

    return v3Strategies;
  };

  public getMakerStrategies = async (
    blockNumber: string | number
  ): Promise<string[]> => {
    if (blockNumber != "latest" && this.cache.get(blockNumber) !== undefined)
      return this.cache.get(blockNumber) as string[];

    const pools: string[] = await this.getPools(blockNumber);

    let [V2, V3] = await Promise.all([
      this.getV2Strategies(blockNumber, pools),
      this.getV3Strategies(blockNumber, pools)
    ]);

    V2 = Array.from(new Set<string>(V2));
    V3 = Array.from(new Set<string>(V3));

    const valueV2promise = V2.map(async (strat: string) => {
      const sContract = new this.web3.eth.Contract(
        Strategy_ABI,
        strat,
      );
      const name: string = await sContract.methods.NAME().call({}, blockNumber);
      if(!name.includes("Maker")) return BigInt(0);
      return BigInt(await sContract.methods.totalLocked().call({}, blockNumber));
    });

    const valueV3promise = V3.map(async (strat: string) => {
      const sContract = new this.web3.eth.Contract(
        Strategy_ABI,
        strat,
      );
      const name: string = await sContract.methods.NAME().call({}, blockNumber);
      if(!name.includes("Maker")) return BigInt(0);
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
