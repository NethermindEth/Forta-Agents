import { providers, Contract, BigNumber } from "ethers";
import abi from "./abi";

export default class PairFetcher {
  readonly factoryAddress: string;
  private factoryContract: Contract;

  constructor(factory: string, provider: providers.Provider) {
    this.factoryAddress = factory;
    this.factoryContract = new Contract(factory, abi.FACTORY, provider);
  }

  public async getAllPairs(block: number | string): Promise<string[]> {
    const length: number = await this.factoryContract.allPairsLength({ blockTag: block });

    const pairPromises: Promise<string>[] = [];
    for (let i = BigNumber.from(0); i.lt(length); i = i.add(1)) {
      pairPromises.push(
        this.factoryContract
          .allPairs(i, { blockTag: block })
          .then((pair: string) => pair.toLowerCase())
      );
    }

    return Promise.all(pairPromises);
  }
}
