import { providers, Contract, BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { NetworkManager } from "forta-agent-tools";
import { NetworkData } from "./utils";
import { RESERVES_ABI, TARGET_RESERVES_ABI } from "./constants";

// Class to fetch on-chain data
export default class Fetcher {
  provider: providers.Provider;
  networkManager: NetworkManager<NetworkData>;
  cometContracts: Record<string, Contract>;

  constructor(
    provider: providers.Provider,
    networkManager: NetworkManager<NetworkData>
  ) {
    this.provider = provider;
    this.networkManager = networkManager;
    this.cometContracts = {};
  }
  public async setContracts() {
    this.networkManager.get("cometAddresses").map((addr: string) => {
      this.cometContracts[addr] = new Contract(
        addr,
        new Interface([RESERVES_ABI, TARGET_RESERVES_ABI]),
        this.provider
      );
    });
  }
  public async getReserves(
    address: string,
    block: number | string
  ): Promise<BigNumber> {
    const reserves: BigNumber = this.cometContracts[address].getReserves({
      blockTag: block,
    });
    return reserves;
  }

  public async getTargetReserves(
    address: string,
    block: number | string
  ): Promise<BigNumber> {
    const targetReserves: BigNumber = this.cometContracts[
      address
    ].targetReserves({
      blockTag: block,
    });
    return targetReserves;
  }
}
