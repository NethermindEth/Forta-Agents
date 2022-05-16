interface NetworkData {
  safetyModule: string;
  liquidityModule: string;
}

const ETH_MAINNET_DATA: NetworkData = {
  safetyModule: "0x65f7BA4Ec257AF7c55fd5854E5f6356bBd0fb8EC",
  liquidityModule: "0x5Aa653A076c1dbB47cec8C1B4d152444CAD91941",
};

// Using the same Kovan testnet address since we are
// listening to the same event emissions in both module contracts
const KOVAN_TESTNET_DATA: NetworkData = {
  safetyModule: "0x6dEA282B05C76cC9249513554A3C4Bf646908344",
  liquidityModule: "0x6dEA282B05C76cC9249513554A3C4Bf646908344",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  1: ETH_MAINNET_DATA,
  42: KOVAN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public safetyModule: string;
  public liquidityModule: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.safetyModule = "";
    this.liquidityModule = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { safetyModule, liquidityModule } = this.networkMap[networkId];
      this.safetyModule = safetyModule;
      this.liquidityModule = liquidityModule;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      throw new Error("You are running the bot in a non supported network");
    }
  }
}