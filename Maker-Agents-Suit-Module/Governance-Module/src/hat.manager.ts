import { hatCall, propertyFetcher, PropertyFetcher } from "./utils";

export default class HatManager {
  private address: string;
  private block: number;
  private hatFetcher: PropertyFetcher;

  public constructor(web3Call: any, contractAddress: string) {
    this.block = -1;
    this.address = "None";
    this.hatFetcher = propertyFetcher(web3Call, contractAddress, hatCall, 'address');
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
