import { APEFACTORY_ABI } from "./constants";
const { APEFACTORY_ADDRESS_BSC, APEFACTORY_ADDRESS_POLYGON } = APEFACTORY_ABI;

interface NetworkData {
  apeFactoryAddress: string;
}

const BSC_DATA: NetworkData = {
  apeFactoryAddress: APEFACTORY_ADDRESS_BSC,
};

const POLYGON_DATA: NetworkData = {
  apeFactoryAddress: APEFACTORY_ADDRESS_POLYGON,
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  56: BSC_DATA,
  137: POLYGON_DATA,
};

export default class NetworkManager implements NetworkData {
  public apeFactoryAddress: string;

  constructor() {
    this.apeFactoryAddress = "";
  }

  public setNetwork(networkId: number) {
    const { apeFactoryAddress } = NETWORK_MAP[networkId];
    this.apeFactoryAddress = apeFactoryAddress;
  }
}
