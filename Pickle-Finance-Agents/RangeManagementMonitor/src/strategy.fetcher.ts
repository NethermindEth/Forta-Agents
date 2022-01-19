import { BigNumber, Contract, providers, utils } from "ethers";
import abi from "./abi";

export interface TickInfo {
  lower: BigNumber,
  upper: BigNumber,
  current: BigNumber,
};

export default class StrategyFetcher {
  readonly keeper: string;
  private kContract: Contract;
  private provider: providers.Provider;

  constructor(keeper: string, provider: providers.Provider) {
    this.keeper = keeper;
    this.provider = provider;
    this.kContract = new Contract(keeper, abi.KEEPER, provider);
  }

  public async getStrategies(block: number): Promise<string[]> {
    const encodedLength: string = await this.provider.getStorageAt(this.keeper, 0, block);
    const length: number = utils.defaultAbiCoder.decode(['uint256'], encodedLength)[0];

    const strategiesPromises: Promise<string>[] = [];
    for (let i = 0; i < length; ++i){
      strategiesPromises.push(
        this.kContract
          .strategyArray(i, { blockTag: block })
          .then((strat: string) => strat.toLowerCase())
      )
    }

    return Promise.all(strategiesPromises);
  }

  public async getTicks(block: number, strat: string): Promise<TickInfo> {
    const sContract: Contract = new Contract(strat, abi.STRATEGY, this.provider);
    const [ pool, lower, upper ] = await Promise.all([
      sContract.pool({ blockTag: block }),
      sContract.tick_lower({ blockTag: block }),
      sContract.tick_upper({ blockTag: block }),
    ]);

    const pContract: Contract = new Contract(pool, abi.POOL, this.provider);
    const current: BigNumber = (await pContract.slot0({ blockTag: block }))[1];

    return { 
      lower: BigNumber.from(lower), 
      upper: BigNumber.from(upper), 
      current: BigNumber.from(current), 
    };
  }
};
