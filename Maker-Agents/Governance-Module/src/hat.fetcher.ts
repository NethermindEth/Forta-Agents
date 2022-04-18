import abi from "./abi";
import { providers, Contract, BigNumber } from "ethers";

export default class HatFetcher {
  private hat: string;
  private block: number;
  private approvals: BigNumber;
  private chiefContract: Contract;

  public constructor(chief: string, provider: providers.JsonRpcProvider) {
    this.block = -1;
    this.hat = "None";
    this.approvals = BigNumber.from(-1);
    this.chiefContract = new Contract(chief, abi.CHIEF, provider);
  }

  public async getHat(block: number) {
    if (this.block !== block) {
      this.block = block;
      this.approvals = BigNumber.from(-1);
      this.hat = await this.chiefContract.hat({ blockTag: block });
    }
    return this.hat;
  }

  public async getHatApprovals(block: number) {
    if (this.approvals.eq(-1)) this.approvals = await this.chiefContract.approvals(this.hat, { blockTag: block });
    return this.approvals;
  }
}
