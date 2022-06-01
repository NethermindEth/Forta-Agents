interface NetworkData {
  factory: string;
}

const AVAX_MAINNET_DATA: NetworkData = {
  factory: "0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10",
};

const FUJI_TESTNET_DATA: NetworkData = {
  factory: "", // NOTE: ADD AFTER DEPLOYING PoC CONTRACTS
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  43114: AVAX_MAINNET_DATA,
  43113: FUJI_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public factory: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.factory = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { factory } = this.networkMap[networkId];
      this.factory = factory;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
