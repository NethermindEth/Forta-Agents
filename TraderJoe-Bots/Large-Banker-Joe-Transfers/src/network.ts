interface NetworkData {
  joeTroller: string;
}

const AVALANCHE_DATA: NetworkData = {
  joeTroller: "0xdc13687554205E5b89Ac783db14bb5bba4A1eDaC".toLowerCase(),
};

const KOVAN_TESTNET_DATA: NetworkData = {
  joeTroller: "".toLowerCase(),
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  43114: AVALANCHE_DATA,
  42: KOVAN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public joeTroller: string;

  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData> = NETWORK_MAP) {
    this.joeTroller = "";

    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { joeTroller } = this.networkMap[networkId];
      this.joeTroller = joeTroller;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
