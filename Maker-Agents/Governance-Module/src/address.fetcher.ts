import { providers, Contract, utils } from "ethers";
import { CHAINLOG_IFACE } from "./abi";

export default class AddressFetcher {
  readonly provider: providers.Provider;
  readonly chainLogAddress: string;
  public chiefAddress: string;
  private chainLogContract: Contract;

  constructor(provider: providers.Provider, contractAddr: string) {
    this.provider = provider;
    this.chainLogAddress = contractAddr;
    this.chainLogContract = new Contract(contractAddr, CHAINLOG_IFACE, provider);
    this.chiefAddress = "";
  }

  public async getChiefAddress(block: string | number): Promise<string> {
    const key: string = utils.formatBytes32String("MCD_ADM"); // chief contract's key value
    this.chiefAddress = await this.chainLogContract.getAddress(key, { blockTag: block });
    return this.chiefAddress;
  }
}
