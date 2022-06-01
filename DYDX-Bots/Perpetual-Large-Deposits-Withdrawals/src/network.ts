interface NetworkData {
  perpetualProxy: string;
  slots: { systemSlot: string | number; mappingSlot: string | number };
}

const ETH_MAINNET_DATA: NetworkData = {
  perpetualProxy: "0xD54f502e184B6B739d7D27a6410a67dc462D69c8",
  slots: {
    systemSlot: "18446744073709551616", // storage slot where system assetType is stored.
    mappingSlot: 20,
  },
};

const KOVAN_TESTNET_DATA: NetworkData = {
  perpetualProxy: "0x6Fc6DCD68e995b90234b332ef66218565377c898",
  slots: {
    systemSlot: 0,
    mappingSlot: 1,
  },
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  1: ETH_MAINNET_DATA,
  42: KOVAN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public perpetualProxy: string;
  networkMap: Record<number, NetworkData>;
  slots: { systemSlot: string | number; mappingSlot: string | number };

  constructor(networkMap: Record<number, NetworkData>) {
    this.perpetualProxy = "";
    this.networkMap = networkMap;
    this.slots = {
      systemSlot: "",
      mappingSlot: "",
    };
  }

  public setNetwork(networkId: number) {
    try {
      const { perpetualProxy, slots } = this.networkMap[networkId];
      this.perpetualProxy = perpetualProxy;
      this.slots = slots;
    } catch {
      // The bot is run in a network not defined in the networkMap.
      // There's no contract deployed in that network.
      throw new Error("You are running the bot in a non supported network");
    }
  }
}
