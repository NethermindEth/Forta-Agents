import { providers, Contract, BigNumber } from "ethers";
import abi from "./abi";

export default class PairFetcher {
  private provider: providers.JsonRpcProvider;

  constructor(provider: providers.JsonRpcProvider) {
    this.provider = provider;
  };

  public async getV2Data(pair: string, block: number): Promise<[boolean, string, string]> {
    const contract: Contract = new Contract(pair, abi.COMMON, this.provider);
    try {
      const [token0, token1] = await Promise.all([
        contract.token0({ blockTag: block }),
        contract.token1({ blockTag: block }),
      ]);
      return [true, token0.toLowerCase(), token1.toLowerCase()];
    } catch {
      return [false, "", ""];
    }
  };

  public async getV3Data(pair: string, block: number): Promise<[boolean, string, string, BigNumber]> {
    const contract: Contract = new Contract(pair, abi.COMMON, this.provider);
    try {
      const [token0, token1, fee] = await Promise.all([
        contract.token0({ blockTag: block }),
        contract.token1({ blockTag: block }),
        contract.fee({ blockTag: block }),
      ]);
      return [true, token0.toLowerCase(), token1.toLowerCase(), fee];
    } catch {
      return [false, "", "", BigNumber.from(0)];
    }
  };
};
