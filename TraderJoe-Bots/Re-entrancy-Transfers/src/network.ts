interface NetworkData {
  joeTroller: string;
  sJoeStaking: string;
  masterChefV2: string;
  moneyMaker: string;
}

const AVALANCHE_DATA: NetworkData = {
  joeTroller: "0xdc13687554205E5b89Ac783db14bb5bba4A1eDaC",
  sJoeStaking: "0x1a731B2299E22FbAC282E7094EdA41046343Cb51",
  masterChefV2: "0xd6a4F121CA35509aF06A0Be99093d08462f53052",
  moneyMaker: "0x63C0CF90aE12190B388F9914531369aC1e4e4e47",
};

const KOVAN_TESTNET_DATA: NetworkData = {
  joeTroller: "0xdc13687554205E5b89Ac783db14bb5bba4A1eDaC",
  sJoeStaking: "0x1a731B2299E22FbAC282E7094EdA41046343Cb51",
  masterChefV2: "0xd6a4F121CA35509aF06A0Be99093d08462f53052",
  moneyMaker: "0x63C0CF90aE12190B388F9914531369aC1e4e4e47",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  43114: AVALANCHE_DATA,
  42: KOVAN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public joeTroller: string;
  public sJoeStaking: string;
  public masterChefV2: string;
  public moneyMaker: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData> = NETWORK_MAP) {
    this.joeTroller = "";
    this.sJoeStaking = "";
    this.masterChefV2 = "";
    this.moneyMaker = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { joeTroller, sJoeStaking, masterChefV2, moneyMaker } = this.networkMap[networkId];
      this.joeTroller = joeTroller;
      this.sJoeStaking = sJoeStaking;
      this.masterChefV2 = masterChefV2;
      this.moneyMaker = moneyMaker;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
