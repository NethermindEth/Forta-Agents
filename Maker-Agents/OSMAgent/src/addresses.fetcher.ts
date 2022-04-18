import { providers, Contract } from "ethers";
import { parseBytes32String } from "ethers/lib/utils";
import { FUNCTIONS_ABIS, EVENTS_ABIS } from "./utils";

export default class AddressesFetcher {
  provider: providers.Provider;
  chainLogAddress: string;
  osmContracts: Map<string, string>;
  private chainLogContract: Contract;

  constructor(provider: providers.Provider, contractAddr: string) {
    this.provider = provider;
    this.chainLogAddress = contractAddr;
    this.chainLogContract = new Contract(contractAddr, [FUNCTIONS_ABIS, EVENTS_ABIS].flat(), provider);
    this.osmContracts = new Map();
  }

  // fetches all OSM addresses (starting with PIP_)
  public async getOsmAddresses(block: string | number) {
    // get keys list
    const list: string[] = await this.chainLogContract.list({ blockTag: block });
    // save addresses of keys starting with PIP_
    for (let key of list) {
      const name = parseBytes32String(key);
      if (name.startsWith("PIP_"))
        this.osmContracts.set(key, (await this.chainLogContract.getAddress(key, { blockTag: block })).toLowerCase());
    }
  }

  // Update the addresses list
  public updateAddresses(name: string, args: string[]) {
    if (name === "UpdateAddress") {
      // update the address associated with the key.
      this.osmContracts.set(args[0], args[1]);
    } else {
      // remove key-value.
      this.osmContracts.delete(args[0]);
    }
  }
}
