import { VAULT_ARBITRUM, VAULT_AVALANCHE } from "./constants";

interface NetworkData {
  vaultAddress: string;
  threshold: number;
}

const ARBITRUM_DATA: NetworkData = {
  vaultAddress: VAULT_ARBITRUM,
  threshold: 6000,
};

const AVALANCHE_DATA: NetworkData = {
  vaultAddress: VAULT_AVALANCHE,
  threshold: 4000,
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  42161: ARBITRUM_DATA,
  43114: AVALANCHE_DATA,
};

export default class NetworkManager implements NetworkData {
  public vaultAddress: string;
  public threshold: number;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.vaultAddress = "0x0000000000000000000000000000000000000000"; // zero address by default
    this.threshold = 0;
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { vaultAddress, threshold } = this.networkMap[networkId];
      this.vaultAddress = vaultAddress.toLowerCase(); // vault address based on the detected chain id
      this.threshold = threshold; // threshold based on the detected chain id
    } catch {
      throw new Error("You are running on an unsupported network");
    }
  }
}
