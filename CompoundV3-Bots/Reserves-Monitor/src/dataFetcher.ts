import { ethers } from "forta-agent";
import { providers, Contract, BigNumber, BigNumberish } from "ethers";
import { Interface } from "ethers/lib/utils";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData } from "./utils";
import { RESERVES_ABI, TARGET_RESERVES_ABI } from "./constants";

// Class to fetch on-chain data
export default class Fetcher {
  cometContracts: Record<string, Contract> = {};

  public loadContracts(
    networkManager: NetworkManager<NetworkData>,
    provider: providers.Provider
  ) {
    const cometIface = new Interface([RESERVES_ABI, TARGET_RESERVES_ABI]);

    networkManager.get("cometAddresses").forEach((addr: string) => {
      this.cometContracts[addr] = new Contract(addr, cometIface, provider);
    });
  }

  public async getReserves(
    address: string,
    block: BigNumberish
  ): Promise<BigNumber> {
    const comet = this.cometContracts[address];
    return comet.getReserves({ blockTag: block });
  }

  public async getTargetReserves(
    address: string,
    block: BigNumberish
  ): Promise<BigNumber> {
    const comet = this.cometContracts[address];
    return comet.targetReserves({ blockTag: block });
  }
}
