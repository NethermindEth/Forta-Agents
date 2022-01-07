import abi from "./abi";
import LRU from "lru-cache";
import { BigNumber, Contract, providers } from "ethers";

export default class ReserveFetcher {
  private storage: LRU<number, BigNumber>;
  readonly treasury: string;
  private tContract: Contract;

  constructor(contract: string, provider: providers.Provider){
    this.treasury = contract;
    this.tContract = new Contract(contract, abi.TREASURY_ABI, provider);
    this.storage = new LRU<number, BigNumber>();
  }

  public update(block: number, reserve: BigNumber) {
    this.storage.set(block, reserve);
  }

  public async getLastSeenReserve(block: number): Promise<BigNumber> {
    // try to get the last value stored
    if(this.storage.get(block) !== undefined)
      return this.storage.get(block) as BigNumber;

    // initialize the value with the final value of the previous block
    const reserve = await this.tContract.totalReserves({ blockTag: block - 1 });
    this.update(block, reserve);
    return reserve;
  }

  public clear() {
    this.storage.reset();
  }
};
