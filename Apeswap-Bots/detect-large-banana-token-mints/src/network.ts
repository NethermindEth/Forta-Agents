import { BANANA_CONSTANTS } from "./constants";

const { BANANA_CONTRACT_ADDRESS_BSC, BANANA_CONTRACT_ADDRESS_POLYGON, BANANA_CONTRACT_ADDRESS_BSC_TESTNET } =
  BANANA_CONSTANTS;

interface NetworkData {
  bananaAddress: string;
}

const BSC_DATA: NetworkData = {
  bananaAddress: BANANA_CONTRACT_ADDRESS_BSC,
};

const BSC_TESTNET_DATA: NetworkData = {
  bananaAddress: BANANA_CONTRACT_ADDRESS_BSC_TESTNET,
};

const POLYGON_DATA: NetworkData = {
  bananaAddress: BANANA_CONTRACT_ADDRESS_POLYGON,
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  56: BSC_DATA,
  137: POLYGON_DATA,
  97: BSC_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public bananaAddress: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.bananaAddress = "0x0000000000000000000000000000000000000000";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { bananaAddress } = this.networkMap[networkId];
      this.bananaAddress = bananaAddress;
    } catch {
      throw new Error("You are running the bot in a unsupported network");
    }
  }
}
