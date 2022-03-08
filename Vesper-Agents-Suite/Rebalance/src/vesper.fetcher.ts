import { createFetcher, Fetcher } from "./utils";
import { isZeroAddress } from "ethereumjs-util";
import LRU from "lru-cache";
import abi from "./abi";
const axios = require("axios");
export const API_URL = "https://api.vesper.finance/dashboard?version=2";
const STATUS = "operative";
const ALLOWED_STAGES = ["prod", "beta", "orbit"];
const IGNORE_ADDRESS = ["0xbA4cFE5741b357FA371b506e5db0774aBFeCf8Fc"];

type BlockId = string | number;

interface StrategiesData {
  V2: Set<string>;
  V3: Set<string>;
}

export default class VesperFetcher {
  private web3Call: any;
  private controller: string;
  private cache: LRU<BlockId, any>;

  constructor(web3Call: any, controller: string) {
    this.web3Call = web3Call;
    this.controller = controller;
    this.cache = new LRU<BlockId, any>({ max: 10_000 });
  }

  public getPools = async () => {
    return axios.get(API_URL).then((response: { data: { pools: any[] } }) => {
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
          const poolAccountant  = (await createFetcher(
            this.web3Call,
            pool,
            abi.PoolABI
          )(block))[0];
          const {active, debtRatio} = (await createFetcher(
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
}
