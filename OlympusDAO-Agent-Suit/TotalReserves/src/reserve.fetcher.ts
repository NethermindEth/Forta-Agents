import abi from "./abi";
import LRU from "lru-cache";
import { BigNumber, Contract, providers } from "ethers";

export default class ReserveFetcher {
  private cache: LRU<number, BigNumber>;
  readonly treasury: string;
  private tContract: Contract;

  constructor(contract: string, provider: providers.Provider){
    this.treasury = contract;
    this.tContract = new Contract(contract, abi.TREASURY_ABI, provider);
    this.cache = new LRU<number, BigNumber>();
  }

  public set(block: number, reserve: BigNumber) {
    this.cache.set(block, reserve);
  }

  public async getReserve(block: number): Promise<BigNumber> {
    if(this.cache.get(block) !== undefined)
      return this.cache.get(block) as BigNumber;

    const reserve = await this.tContract.totalReserves({ blockTag: block - 1 });
    this.set(block, reserve);
    return reserve;
  }
};
