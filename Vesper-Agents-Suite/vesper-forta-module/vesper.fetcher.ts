import { createFetcher, Fetcher } from "./utils";

import { isZeroAddress } from "ethereumjs-util";
import Web3 from "web3";
import LRU from "lru-cache";
import abi from "./abi";
const axios = require("axios");
const STATUS = "operative";
const ALLOWED_STAGES = ["prod", "beta", "orbit"];
const IGNORE_ADDRESS = ["0xbA4cFE5741b357FA371b506e5db0774aBFeCf8Fc"];
const poolAccountantsCache = new LRU({ max: 10_000 });

type BlockId = string | number;

interface StrategiesData {
  V2: Set<string>;
  V3: Set<string>;
}

export default class VesperFetcher {
  private web3Call: any;
  private web3: Web3;
  private controller: string;
  private cache: LRU<BlockId, any>;

  constructor(web3: any, controller: string) {
    this.web3 = web3
    this.web3Call = web3.eth.call;
    this.controller = controller;
    this.cache = new LRU<BlockId, any>({ max: 10_000 });
  }

  public getPools = async (networkName = "") => {
    const apiUrl = `https://api.${networkName}vesper.finance/dashboard?version=2`
    return axios.get(apiUrl).then((response: { data: { pools: any[] } }) => {
      return response.data.pools
        .filter(
          (pool: {
            status: string;
            stage: string;
            contract: { version: string; address: string };
          }) =>
            pool.status === STATUS &&
            ALLOWED_STAGES.includes(pool.stage) &&
            !IGNORE_ADDRESS.includes(pool.contract.address)
        )
        .map((pool) => pool.contract.address);
    });
  };

  private async _getStrategies(
    block: BlockId,
    fetchV3: boolean = true
  ): Promise<StrategiesData> {
    const pools = await this.getPools();

    const V2: Set<string> = new Set<string>();
    const V3: Set<string> = new Set<string>();
    const fetchStrat = await createFetcher(
      this.web3Call,
      this.controller,
      abi.STRATEGY
    );
    for (let pool of pools) {
      const { strategy } = await fetchStrat(block, pool);
      if (!isZeroAddress(strategy)) {
        V2.add(strategy.toLowerCase());
      } else if (fetchV3) {
        const { strategiesList } = await createFetcher(
          this.web3Call,
          pool,
          abi.GET_STRATEGIES
        )(block);
        strategiesList.forEach(async (addr: string) => {
          const poolAccountant = (await createFetcher(
            this.web3Call,
            pool,
            abi.PoolABI
          )(block))[0];
          const { active, debtRatio } = (await createFetcher(
            this.web3Call,
            poolAccountant,
            abi.Accountant_ABI
          )(block, poolAccountant));
          if (active && BigInt(debtRatio) > 0) {
            V3.add(addr.toLowerCase());
          }
        });
      }
    }
    return { V2, V3 };
  }

  public async getStrategiesV2(block: BlockId = "latest"): Promise<string[]> {
    const { V2 } = await this._getStrategies(block, false);
    return Array.from(V2);
  }

  public async getStrategiesV3(block: BlockId = "latest"): Promise<string[]> {
    const { V3 } = await this._getStrategies(block);
    return Array.from(V3);
  }

  public async getAllStrategies(block: BlockId = "latest"): Promise<string[]> {
    if (block !== "latest" && this.cache.get(block) !== undefined)
      return this.cache.get(block);
    const { V2, V3 } = await this._getStrategies(block);
    V3.forEach((strat: string) => V2.add(strat));

    const strategies: string[] = Array.from(V2);
    this.cache.set(block, strategies);
    return strategies;
  }

  public async getTotalValue(contract: any, blockNumber: number) {
    const value = await contract.methods.totalValue().call({}, blockNumber);
    return value;
  };

  public async getTokensHere(contract: any, blockNumber: number) {
    return await contract.methods.tokensHere().call({}, blockNumber);
  };

  public async getPoolAccountants(
    blockNumber: number | string = "latest"
  ): Promise<string[]> {
    if (
      blockNumber !== "latest" &&
      poolAccountantsCache.get(blockNumber) !== undefined
    ) {
      return poolAccountantsCache.get(blockNumber) as any;
    }

    const poolAccountants: string[] = [];
    const pools: string[] = await this.getPools();
    for (let pool of pools) {
      try {
        const poolContract = new this.web3.eth.Contract(abi.PoolABI, pool);
        const poolAccountant = await poolContract.methods
          .poolAccountant()
          .call({}, blockNumber);
        poolAccountants.push(poolAccountant);
      } catch {

      }
    }
    poolAccountantsCache.set(blockNumber, poolAccountants);
    return poolAccountants;
  };
}
