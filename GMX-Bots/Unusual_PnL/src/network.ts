export interface NetworkData {
  vault: string;
  unUsualLimit: string;
  highPnlToSize: string;
}

const ARBITRUM_MAINNET_DATA: NetworkData = {
  vault: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
  unUsualLimit: "33000",
  highPnlToSize: "1.1", //percent
};

const AVALANCHE_MAINNET_DATA: NetworkData = {
  vault: "0x9ab2De34A33fB459b538c43f251eB825645e8595",
  unUsualLimit: "24000",
  highPnlToSize: "2.8", // percent
};

const NETWORK_MAP: Record<number, NetworkData> = {
  42161: ARBITRUM_MAINNET_DATA,
  43114: AVALANCHE_MAINNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public vault: string;
  public unUsualLimit: string;
  public highPnlToSize: string;

  constructor() {
    this.vault = "";
    this.unUsualLimit = "";
    this.highPnlToSize = "";
  }

  public setNetwork(networkId: number) {
    const { vault, unUsualLimit, highPnlToSize } = NETWORK_MAP[networkId];
    this.vault = vault;
    this.unUsualLimit = unUsualLimit;
    this.highPnlToSize = highPnlToSize;
  }
}
