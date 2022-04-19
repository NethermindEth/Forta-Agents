import abi from "./abi";
import { providers, Contract, BigNumber } from "ethers";
import AddressFetcher from "./address.fetcher";

export default class HatFetcher {
  private hat: string;
  private block: number;
  private approvals: BigNumber;
  chiefFetcher: AddressFetcher;
  provider: providers.JsonRpcProvider;

  public constructor(chiefFetcher: AddressFetcher, provider: providers.JsonRpcProvider) {
    this.block = -1;
    this.hat = "None";
    this.approvals = BigNumber.from(-1);
    this.chiefFetcher = chiefFetcher;
    this.provider = provider;
  }

  public async getHat(block: number) {
    if (this.block !== block) {
      this.block = block;
      this.approvals = BigNumber.from(-1);
      const contract = new Contract(this.chiefFetcher.chiefAddress, abi.CHIEF, this.provider);
      this.hat = await contract.hat({ blockTag: block });
    }
    return this.hat;
  }

  public async getHatApprovals(block: number) {
    const contract = new Contract(this.chiefFetcher.chiefAddress, abi.CHIEF, this.provider);
    if (this.approvals.eq(-1)) this.approvals = await contract.approvals(this.hat, { blockTag: block });
    return this.approvals;
  }
}
