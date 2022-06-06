interface NetworkData {
  monitoredContracts: string[];
}

const AVALANCHE_DATA: NetworkData = {
  monitoredContracts: [
    "0x1a731B2299E22FbAC282E7094EdA41046343Cb51".toLowerCase(), // sJoeStaking
    "0x25D85E17dD9e544F6E9F8D44F99602dbF5a97341".toLowerCase(), // veJoeStaking
    "0x3cabf341943Bc8466245e4d6F1ae0f8D071a1456".toLowerCase(), // veJoeToken
    "0xd6a4F121CA35509aF06A0Be99093d08462f53052".toLowerCase(), // MasterChefJoeV2
    "0x188bED1968b795d5c9022F6a0bb5931Ac4c18F00".toLowerCase(), // MasterChefJoeV3
    "0x4483f0b6e2F5486D06958C20f8C39A7aBe87bf8F".toLowerCase(), // BoostedMasterChefJoe
    "0xFea7879Bf27B4461De9a9b8A03dBcc7f49C52bEa".toLowerCase(), // 2nd Team Vesting
    "0x5483ce08659fABF0277f9314868Cc4f78687BD08".toLowerCase(), // RocketJoeToken
    "0x102D195C3eE8BF8A9A89d63FB3659432d3174d81".toLowerCase(), // RocketJoeStaking
    "0x37551bc793175DA03012bFD10b285A033b62247E".toLowerCase(), // RocketJoeFactory
  ],
};

const KOVAN_TESTNET_DATA: NetworkData = {
  monitoredContracts: ["".toLowerCase()], // NOTE: FILL IN WHEN DEPLOYED
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  43114: AVALANCHE_DATA,
  42: KOVAN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public monitoredContracts: string[];
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.monitoredContracts = [""];
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { monitoredContracts } = this.networkMap[networkId];
      this.monitoredContracts = monitoredContracts;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
