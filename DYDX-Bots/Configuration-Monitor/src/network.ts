interface NetworkData {
  perpetualProxy: string;
}

const ETH_MAINNET_DATA: NetworkData = {
  perpetualProxy: "0xD54f502e184B6B739d7D27a6410a67dc462D69c8",
};

const ROPSTEN_TESTNET_DATA: NetworkData = {
  perpetualProxy: "0xCD8Fa8342D779F8D6acc564B73746bF9ca1261C6",
};

const NETWORK_MAP: Record<number, NetworkData> = {
  1: ETH_MAINNET_DATA,
  3: ROPSTEN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public perpetualProxy: string;

  constructor() {
    this.perpetualProxy = "";
  }

  public setNetwork(networkId: number) {
    const { perpetualProxy } = NETWORK_MAP[networkId];
    this.perpetualProxy = perpetualProxy;
  }
}
