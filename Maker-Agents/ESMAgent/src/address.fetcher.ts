import { providers, Contract } from "ethers";
import { CHAINLOG_IFACE, ESM_KEY_BYTES } from "./utils";

export default class AddressFetcher {
  readonly provider: providers.Provider;
  readonly chainLogAddress: string;
  public esmAddress: string;
  private chainLogContract: Contract;

  constructor(provider: providers.Provider, contractAddr: string) {
    this.provider = provider;
    this.chainLogAddress = contractAddr;
    this.chainLogContract = new Contract(contractAddr, CHAINLOG_IFACE, provider);
    this.esmAddress = "";
  }

  public async getEsmAddress(block: string | number): Promise<string> {
    this.esmAddress = await this.chainLogContract.getAddress(ESM_KEY_BYTES, { blockTag: block });
    return this.esmAddress;
  }
}
