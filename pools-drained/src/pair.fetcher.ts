import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import abi from "./abi";

type V2_DATA = [boolean, string, string];
type V3_DATA = [boolean, string, string, BigNumber];

export default class PairFetcher {
  private provider: providers.JsonRpcProvider;
  private cache: LRU<string, any[]>;

  constructor(provider: providers.JsonRpcProvider) {
    this.provider = provider;
    this.cache = new LRU<string, any[]>({max: 10000});
  };

  public async getV2Data(pair: string, block: number): Promise<V2_DATA> {
    const key: string = `V2-${pair}-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as V2_DATA;

    const contract: Contract = new Contract(pair, abi.COMMON, this.provider);
    let output: V2_DATA;
    try {
      const [token0, token1] = await Promise.all([
        contract.token0({ blockTag: block }),
        contract.token1({ blockTag: block }),
      ]);
      output = [true, token0.toLowerCase(), token1.toLowerCase()];
    } catch {
      output = [false, "", ""];
    }
    this.cache.set(key, output);
    return output;
  };

  public async getV3Data(pair: string, block: number): Promise<V3_DATA> {
    const key: string = `V3-${pair}-${block}`;
    if(this.cache.has(key))
      return this.cache.get(key) as V3_DATA;

    const contract: Contract = new Contract(pair, abi.COMMON, this.provider);
    let output: V3_DATA;
    try {
      const [token0, token1, fee] = await Promise.all([
        contract.token0({ blockTag: block }),
        contract.token1({ blockTag: block }),
        contract.fee({ blockTag: block }),
      ]);
      output = [true, token0.toLowerCase(), token1.toLowerCase(), fee];
    } catch {
      output = [false, "", "", BigNumber.from(0)];
    }
    this.cache.set(key, output);
    return output;
  };
};
