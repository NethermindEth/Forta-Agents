interface NetworkData {
  multicall2: string;
  factory: string;
  pairInitCodeHash: string;
}

const AVAX_MAINNET_DATA: NetworkData = {
  multicall2: "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4",
  factory: "0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10",
  pairInitCodeHash: "0x0bbca9af0511ad1a1da383135cf3a8d2ac620e549ef9f6ae3a4c33c2fed0af91",
};

const KOVAN_TESTNET_DATA: NetworkData = {
  multicall2: "0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696",
  factory: "0x3CAfAF7cA21ccfeB3B09CCC8a7e03109d207CDc4",
  pairInitCodeHash: "0xea2e4d8ff7b84771dace7688751971197f2a4578c0298c78d11d93165de73773",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  43114: AVAX_MAINNET_DATA,
  42: KOVAN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public multicall2: string;
  public factory: string;
  public pairInitCodeHash: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData> = NETWORK_MAP) {
    this.multicall2 = "";
    this.factory = "";
    this.pairInitCodeHash = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { multicall2, factory, pairInitCodeHash } = this.networkMap[networkId];
      this.multicall2 = multicall2;
      this.factory = factory;
      this.pairInitCodeHash = pairInitCodeHash;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
