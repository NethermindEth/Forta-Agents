interface NetworkData {
  hubPoolAddress: string;
}

const ETH_MAINNET_DATA: NetworkData = {
  hubPoolAddress: "0xc186fA914353c44b2E33eBE05f21846F1048bEda",
};

const GOERLI_TESTNET_DATA: NetworkData = {
  hubPoolAddress: "0xC9bea435388B76e627Ff99AD1187e520299E0656", // MockHubpool on Goerli testnet
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  1: ETH_MAINNET_DATA,
  5: GOERLI_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public hubPoolAddress: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.hubPoolAddress = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { hubPoolAddress } = this.networkMap[networkId];
      this.hubPoolAddress = hubPoolAddress;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
