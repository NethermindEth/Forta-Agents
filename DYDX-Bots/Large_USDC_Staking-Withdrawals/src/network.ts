interface NetworkData {
  liquidityModule: string;
  usdcAddress: string;
}

const ETH_MAINNET_DATA: NetworkData = {
  liquidityModule: "0x5Aa653A076c1dbB47cec8C1B4d152444CAD91941",
  usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
};

const KOVAN_TESTNET_DATA: NetworkData = {
  liquidityModule: "0x5b7eA2cEaAA5EcC511B453505d260eFB1fBa4fDF",
  usdcAddress: "0x9bc9a7D5ed679C17abECE73461Cbba9433B541c5", // TestToken on Kovan testnet
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  1: ETH_MAINNET_DATA,
  42: KOVAN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public liquidityModule: string;
  public usdcAddress: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.liquidityModule = "";
    this.usdcAddress = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { liquidityModule, usdcAddress } = this.networkMap[networkId];
      this.liquidityModule = liquidityModule;
      this.usdcAddress = usdcAddress;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
