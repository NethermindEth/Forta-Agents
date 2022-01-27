import { providers, Contract, BigNumber } from "ethers";
import abi from "./abi";

export default class PairFetcher {
  readonly factory: string;
  private fContract: Contract;

  constructor(factory: string, provider: providers.Provider) {
    this.factory = factory;
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
}
