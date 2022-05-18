interface NetworkData {
  gnana: string;
}

const BSC_MAINNET_DATA: NetworkData = {
  gnana: "0xdDb3Bd8645775F59496c821E4F55A7eA6A6dc299",
};

const BSC_TESTNET_DATA: NetworkData = {
  gnana: "0x2449E7940B0Df3426981945431AA9dc95b982702",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  56: BSC_MAINNET_DATA,
  97: BSC_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public gnana: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.gnana = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { gnana } = this.networkMap[networkId];
      this.gnana = gnana;
    } catch {
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
