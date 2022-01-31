import { providers, Contract, BigNumber, BigNumberish } from "ethers";
import abi from "./abi";

interface Reserves {
  reserve0: BigNumberish;
  reserve1: BigNumberish;
}

export default class PairFetcher {
  readonly factory: string;
  private fContract: Contract;
  private provider: providers.Provider;

  constructor(factory: string, provider: providers.Provider) {
    this.factory = factory;
    this.provider = provider;
    this.fContract = new Contract(factory, abi.FACTORY, provider);
  }

  public async getAllPairs(block: number | string): Promise<string[]> {
    const length: number = await this.fContract.allPairsLength({ blockTag: block });

    const pairPromises: Promise<string>[] = [];
    for (let i = BigNumber.from(0); i.lt(length); i = i.add(1)) {
      pairPromises.push(
        this.fContract
          .allPairs(i, { blockTag: block })
          .then((pair: string) => pair.toLowerCase())
      );
    }

    return Promise.all(pairPromises);
  }

  public async getReserves(block: number | string, pair: string): Promise<Reserves> {
    const pContract = new Contract(pair, abi.PAIR, this.provider);
    const { reserve0, reserve1 } = await pContract.getReserves({ blockTag: block });

    return { reserve0, reserve1 };
  }
}
