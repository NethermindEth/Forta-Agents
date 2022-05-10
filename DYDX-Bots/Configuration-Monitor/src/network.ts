interface NetworkData {
  perpetualProxy: string;
}

const ETH_MAINNET_DATA: NetworkData = {
  perpetualProxy: "0xD54f502e184B6B739d7D27a6410a67dc462D69c8",
};

const ROPSTEN_TESTNET_DATA: NetworkData = {
  perpetualProxy: "0xCD8Fa8342D779F8D6acc564B73746bF9ca1261C6",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  1: ETH_MAINNET_DATA,
  3: ROPSTEN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public perpetualProxy: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.perpetualProxy = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { perpetualProxy } = this.networkMap[networkId];
      this.perpetualProxy = perpetualProxy;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      // In that case, the contract address is set to "" and the bot will detect events on all contracts.
      this.perpetualProxy = "";
    }
  }
}
