interface NetworkData {
  perpetualProxy: string;
}

const ETH_MAINNET_DATA: NetworkData = {
  perpetualProxy: "0xD54f502e184B6B739d7D27a6410a67dc462D69c8",
};

const KOVAN_TESTNET_DATA: NetworkData = {
  perpetualProxy: "0xffBfe0EcF9ab8FF44a397ab5324A439ea1a617D8",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  1: ETH_MAINNET_DATA,
  42: KOVAN_TESTNET_DATA,
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
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
