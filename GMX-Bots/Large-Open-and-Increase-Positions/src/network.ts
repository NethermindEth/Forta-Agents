import { VAULT_CONSTANTS } from "./constants";
const { VAULT_ARBITRUM, VAULT_AVALANCHE } = VAULT_CONSTANTS;

interface NetworkData {
  vaultAddress: string;
}

const ARBITRUM_DATA: NetworkData = {
  vaultAddress: VAULT_ARBITRUM,
};

const AVALANCHE_DATA: NetworkData = {
  vaultAddress: VAULT_AVALANCHE,
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  42161: ARBITRUM_DATA,
  43114: AVALANCHE_DATA,
};

export default class NetworkManager implements NetworkData {
  public vaultAddress: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.vaultAddress = "0x0000000000000000000000000000000000000000";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { vaultAddress } = this.networkMap[networkId];
      this.vaultAddress = vaultAddress.toLowerCase();
    } catch {
      throw new Error("You are running on an unsupported network");
    }
  }
}
