import abi from "./abi";
import { providers, Contract, BigNumber } from "ethers";
import AddressFetcher from "./address.fetcher";

export default class HatFetcher {
  private hat: string;
  private block: number;
  private approvals: BigNumber;
  chiefFetcher: AddressFetcher;
  chiefContract: Contract;
  provider: providers.JsonRpcProvider;

  public constructor(chiefFetcher: AddressFetcher, provider: providers.JsonRpcProvider) {
    this.block = -1;
    this.hat = "None";
    this.approvals = BigNumber.from(-1);
    this.chiefFetcher = chiefFetcher;
    this.provider = provider;
    this.chiefContract = new Contract(this.chiefFetcher.chiefAddress, abi.CHIEF, this.provider);
  }

  public async getHat(block: number) {
    if (this.block !== block) {
      this.block = block;
      this.approvals = BigNumber.from(-1);
      // create a new contract instance if chiefAddress has been updated
      if (this.chiefContract.address != this.chiefFetcher.chiefAddress)
        this.chiefContract = new Contract(this.chiefFetcher.chiefAddress, abi.CHIEF, this.provider);
      this.hat = await this.chiefContract.hat({ blockTag: block });
    }
    return this.hat;
  }

  public async getHatApprovals(block: number) {
    // create a new contract instance if chiefAddress has been updated
    if (this.chiefContract.address != this.chiefFetcher.chiefAddress)
      this.chiefContract = new Contract(this.chiefFetcher.chiefAddress, abi.CHIEF, this.provider);

    if (this.approvals.eq(-1)) this.approvals = await this.chiefContract.approvals(this.hat, { blockTag: block });
    return this.approvals;
  }
}
