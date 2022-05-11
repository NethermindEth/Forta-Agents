import { APEFACTORY_ABI } from "./constants";
const { APEFACTORY_ADDRESS_BSC, APEFACTORY_ADDRESS_POLYGON } = APEFACTORY_ABI;

interface NetworkData {
  apeFactory: string;
}

const BSC_DATA: NetworkData = {
  apeFactory: APEFACTORY_ADDRESS_BSC
};

const POLYGON_DATA: NetworkData = {
  apeFactory: APEFACTORY_ADDRESS_POLYGON,
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  56: BSC_DATA,
  137: POLYGON_DATA
};

export default class NetworkManager implements NetworkData {
  public apeFactory: string;

  constructor() {
    this.apeFactory = "";
  }

  public setNetwork(networkId: number) {
    const { apeFactory } = NETWORK_MAP[networkId];
    this.apeFactory = apeFactory;
  }
}
