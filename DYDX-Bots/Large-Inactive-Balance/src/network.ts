interface NetworkData {
  safetyModule: string;
  dydxAddress: string;
}

const ETH_MAINNET_DATA: NetworkData = {
  safetyModule: "0x65f7BA4Ec257AF7c55fd5854E5f6356bBd0fb8EC",
  dydxAddress: "0x92d6c1e31e14520e676a687f0a93788b716beff5",
};

const KOVAN_TESTNET_DATA: NetworkData = {
  safetyModule: "0x267CaE324d5850D84EcA39E2F3C0A8003d3c2F02",
  dydxAddress: "0x136Bb1ff78FBb538B001DC4A50551A088cD0e3CD",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  1: ETH_MAINNET_DATA,
  42: KOVAN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public safetyModule: string;
  public dydxAddress: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.safetyModule = "";
    this.dydxAddress = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { safetyModule, dydxAddress } = this.networkMap[networkId];
      this.safetyModule = safetyModule;
      this.dydxAddress = dydxAddress;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
