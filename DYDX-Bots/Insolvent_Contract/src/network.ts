interface NetworkData {
  liquidityModule: string;
}

const ETH_MAINNET_DATA: NetworkData = {
  liquidityModule: "0x5Aa653A076c1dbB47cec8C1B4d152444CAD91941",
};

const KOVAN_TESTNET_DATA: NetworkData = {
  liquidityModule: "0xe9511Faa2B2ccE548A5999b4bC3772e6a0f1C14A",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  1: ETH_MAINNET_DATA,
  42: KOVAN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public liquidityModule: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.liquidityModule = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { liquidityModule } = this.networkMap[networkId];
      this.liquidityModule = liquidityModule;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
