interface NetworkData {
  safetyModule: string;
  liquidityModule: string;
  dydxAddress: string;
  usdcAddress: string;
}

const ETH_MAINNET_DATA: NetworkData = {
  safetyModule: "0x65f7BA4Ec257AF7c55fd5854E5f6356bBd0fb8EC",
  liquidityModule: "0x5Aa653A076c1dbB47cec8C1B4d152444CAD91941",
  dydxAddress: "0x92d6c1e31e14520e676a687f0a93788b716beff5",
  usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
};

const KOVAN_TESTNET_DATA: NetworkData = {
  // Same address is used for both modules, and both tokens because the detected pattern is the same.
  safetyModule: "0xE719C2aB1256e5b68C4F1Da1fbf6c0771dBbB501",
  liquidityModule: "0xE719C2aB1256e5b68C4F1Da1fbf6c0771dBbB501",
  dydxAddress: "0x127D02DF38Ea031a4EBb6f4b225176a66e004F2e",
  usdcAddress: "0x127D02DF38Ea031a4EBb6f4b225176a66e004F2e",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  1: ETH_MAINNET_DATA,
  42: KOVAN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public safetyModule: string;
  public liquidityModule: string;
  public dydxAddress: string;
  public usdcAddress: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.safetyModule = "";
    this.liquidityModule = "";
    this.dydxAddress = "";
    this.usdcAddress = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { safetyModule, liquidityModule, dydxAddress, usdcAddress } = this.networkMap[networkId];
      this.safetyModule = safetyModule;
      this.liquidityModule = liquidityModule;
      this.dydxAddress = dydxAddress;
      this.usdcAddress = usdcAddress;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
