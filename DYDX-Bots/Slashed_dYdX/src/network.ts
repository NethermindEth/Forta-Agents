interface NetworkData {
    safetyModule: string;
  }
  
  const ETH_MAINNET_DATA: NetworkData = {
    safetyModule: "0x65f7BA4Ec257AF7c55fd5854E5f6356bBd0fb8EC"
  };
  
  // Using the same Kovan testnet address since we are
  // listening to the same event emissions in both module contracts
  const KOVAN_TESTNET_DATA: NetworkData = {
    safetyModule: "" // FILL IN WHEN PoC CONTRACTS ARE DEPLOYED
  };
  
  export const NETWORK_MAP: Record<number, NetworkData> = {
    1: ETH_MAINNET_DATA,
    42: KOVAN_TESTNET_DATA,
  };
  
  export default class NetworkManager implements NetworkData {
    public safetyModule: string;
    networkMap: Record<number, NetworkData>;
  
    constructor(networkMap: Record<number, NetworkData>) {
      this.safetyModule = "";
      this.networkMap = networkMap;
    }
  
    public setNetwork(networkId: number) {
      try {
        const { safetyModule } = this.networkMap[networkId];
        this.safetyModule = safetyModule;
      } catch {
        // The bot is run in a network not defined in the networkMap.
        // There's no contract deployed in that network.
        throw new Error("You are running the bot in a non supported network");
      }
    }
  }