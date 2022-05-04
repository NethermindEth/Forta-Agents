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

const NETWORK_MAP: Record<number, NetworkData> = {
  1: ETH_MAINNET_DATA,
  42: KOVAN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public safetyModule: string;
  public liquidityModule: string;

  constructor() {
    this.safetyModule = "";
    this.liquidityModule = "";
  }

  public setNetwork(networkId: number) {
    const { safetyModule, liquidityModule } = NETWORK_MAP[networkId];
    this.safetyModule = safetyModule;
    this.liquidityModule = liquidityModule;
  }
}
