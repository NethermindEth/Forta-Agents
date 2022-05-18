interface NetworkData {
  safetyModule: string;
  dydxAddress: string;
}

const ETH_MAINNET_DATA: NetworkData = {
  safetyModule: "0x65f7BA4Ec257AF7c55fd5854E5f6356bBd0fb8EC",
  dydxAddress: "0x92D6C1e31e14520e676a687F0a93788B716BEff5",
};

const KOVAN_TESTNET_DATA: NetworkData = {
  safetyModule: "",
  dydxAddress: "", // TestToken on Kovan testnet
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
