import { ethers } from "forta-agent";
import { Interface } from "ethers/lib/utils";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData } from "./utils";
import { RESERVES_ABI, TARGET_RESERVES_ABI } from "./constants";

export default class Fetcher {
  cometContracts: Record<string, ethers.Contract> = {};

  public loadContracts(
    networkManager: NetworkManager<NetworkData>,
    provider: ethers.providers.Provider
  ) {
    const cometIface = new Interface([RESERVES_ABI, TARGET_RESERVES_ABI]);

    networkManager.get("cometAddresses").forEach((addr: string) => {
      this.cometContracts[addr] = new ethers.Contract(
        addr,
        cometIface,
        provider
      );
    });
  }

  public async getReserves(
    address: string,
    block: ethers.BigNumberish
  ): Promise<ethers.BigNumber> {
    const comet = this.cometContracts[address];
    return comet.getReserves({ blockTag: block });
  }

  public async getTargetReserves(
    address: string,
    block: ethers.BigNumberish
  ): Promise<ethers.BigNumber> {
    const comet = this.cometContracts[address];
    return comet.targetReserves({ blockTag: block });
  }
}
