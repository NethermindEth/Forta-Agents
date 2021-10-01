import { PropertyFetcher } from "./utils";

export default class HatManager {
  private address: string;
  private block: number;
  private hatFetcher: PropertyFetcher;

  public constructor(hatFetcher: PropertyFetcher) {
    this.block = -1;
    this.address = "None";
    this.hatFetcher = hatFetcher;
  }

  public async getAddress(block: number) {
    if(this.block !== block)
      return (await this.hatFetcher(block)).toLowerCase();
    return this.address;
  }

  public setAddress(address: string) {
    this.address = address;
    return this;
  }

  public setBlock(block: number) {
    this.block = block;
    return this;
  }
};
