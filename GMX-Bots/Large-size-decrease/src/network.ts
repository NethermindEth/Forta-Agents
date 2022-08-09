export interface NetworkData {
  vault: string;
  largeLimit: number;
}

const ARBITRUM_MAINNET_DATA: NetworkData = {
  vault: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
  largeLimit: 7000

};

const AVALANCHE_MAINNET_DATA: NetworkData = {
  vault: "0x9ab2De34A33fB459b538c43f251eB825645e8595",
  largeLimit: 29000
};

const NETWORK_MAP: Record<number, NetworkData> = {
  42161: ARBITRUM_MAINNET_DATA,
  43114: AVALANCHE_MAINNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public vault: string;
  public largeLimit: number;

  constructor() {
    this.vault = "";
    this.largeLimit = 0;
  }

  public setNetwork(networkId: number) {
    const { vault, largeLimit } = NETWORK_MAP[networkId];
    this.vault = vault;
    this.largeLimit = largeLimit;
  }
}
