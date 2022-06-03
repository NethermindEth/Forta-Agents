interface NetworkData {
  multicall: string;
  factory: string;
}

const AVAX_MAINNET_DATA: NetworkData = {
  multicall: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4",
  factory: "0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10",
};

const KOVAN_TESTNET_DATA: NetworkData = {
  multicall: "0x2cc8688C5f75E365aaEEb4ea8D6a480405A48D2A",
  factory: "0x3CAfAF7cA21ccfeB3B09CCC8a7e03109d207CDc4",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  43114: AVAX_MAINNET_DATA,
  42: KOVAN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public multicall: string;
  public factory: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.multicall = "";
    this.factory = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { multicall, factory } = this.networkMap[networkId];
      this.multicall = multicall;
      this.factory = factory;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
