import { createFetcher, provideGetNetworkId } from "./utils";

import { isZeroAddress } from "ethereumjs-util";
import Web3 from "web3";
import LRU from "lru-cache";
import { STRATEGY, Strategy_ABI, Pool_ABI, GET_STRATEGIES, Accountant_ABI } from "./abi";
import { Network, getEthersProvider } from "forta-agent";
const axios = require("axios");

const STATUS = "operative";
const ALLOWED_STAGES = ["prod", "beta", "orbit"];
// Ignore vVSP pool address as we do not raise any alert for this pool.
const IGNORE_ADDRESS = ["0xbA4cFE5741b357FA371b506e5db0774aBFeCf8Fc"];
// Used for V2
const CONTROLLER: string = "0xa4f1671d3aee73c05b552d57f2d16d3cfcbd0217";
type BlockId = string | number;
const poolAccountantsCache = new LRU({ max: 10_000 });

interface StrategiesData {
  V2: Set<string>;
  V3: Set<string>;
}

export default class VesperFetcher {
  private web3Call: any;
  private web3: Web3;
  private controller: string;
  private cache: LRU<BlockId, any>;

  constructor(web3: any) {
    this.web3 = web3
    this.web3Call = web3.eth.call;
    this.controller = CONTROLLER;
    this.cache = new LRU<BlockId, any>({ max: 10_000 });
  }

  public getApiUrl = (network: number) => {
    let name = ""
    if (network == Network.AVALANCHE) {
      name = '-avalanche'
    }
    else if (network == Network.POLYGON) {
      name = '-polygon'
    }
    return `https://api${name}.vesper.finance/dashboard?version=2`;
  }

  public isLossMaking = async (
    web3: Web3,
    address: string,
    blockNumber: string | number = "latest"
  ) => {
    const Strategy = new web3.eth.Contract(Strategy_ABI, address);
    const result = await Strategy.methods
      .isLossMaking()
      .call({}, blockNumber);

    return result;
  };

  public getPools = async (network: number) => {
    const apiUrl = this.getApiUrl(network)
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
    const provider = await getEthersProvider()
    const network = await provideGetNetworkId(provider)
    const pools = await this.getPools(network);
    const V2: Set<string> = new Set<string>();
    const V3: Set<string> = new Set<string>();
    const fetchStrat = await createFetcher(
      this.web3Call,
      this.controller,
      STRATEGY
    );
    for (let pool of pools) {
      if (network === Network.MAINNET) {
        const { strategy } = await fetchStrat(block, pool);
        if (!isZeroAddress(strategy)) {
          V2.add(strategy.toLowerCase());
        }
      } else if (fetchV3) {
        try {
          const poolAccountant = (await createFetcher(
            this.web3Call,
            pool,
            Pool_ABI
          )(block))[0];

          const { strategiesList } = await createFetcher(
            this.web3Call,
            poolAccountant,
            GET_STRATEGIES
          )(block);
          strategiesList.forEach(async (addr: string) => {
            const { active, debtRatio } = (await createFetcher(
              this.web3Call,
              poolAccountant,
              Accountant_ABI
            )(block, poolAccountant));
            if (active && BigInt(debtRatio) > 0) {
              V3.add(addr.toLowerCase());
            }
          });
        }
        catch { }
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
    const V2 = await this.getStrategiesV2(block);
    const V3 = await this.getStrategiesV3(block);
    const strategies = V2.concat(V3)
    this.cache.set(block, strategies);
    return strategies;
  }

  public async getTotalValue(contract: any, blockNumber: BlockId) {
    const value = await contract.methods.totalValue().call({}, blockNumber);
    return value;
  };

  public async getTokensHere(contract: any, blockNumber: BlockId) {
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
    const provider = await getEthersProvider()
    const network = await provideGetNetworkId(provider)
    const pools: string[] = await this.getPools(network);
    for (let pool of pools) {
      try {
        const poolContract = new this.web3.eth.Contract(Pool_ABI, pool);
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
