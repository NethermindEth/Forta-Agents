import { hatCall, propertyFetcher, PropertyFetcher } from "./utils";

export default class HatManager {
  private address: string;
  private block: number;
  private hatFetcher: PropertyFetcher;

  public constructor(web3Call: any, contractAddress: string) {
    this.block = -1;
    this.address = "None";
    this.hatFetcher = propertyFetcher(web3Call, contractAddress, hatCall, "address");
  }

  public async getAddress(block: number) {
    if (this.block !== block) {
      this.address = (await this.hatFetcher(block)).toLowerCase();
      this.block = block;
    }
    return this.address;
  }
}
