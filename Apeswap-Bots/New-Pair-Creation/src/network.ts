import { APEFACTORY_ABI } from "./constants";

const {
  APEFACTORY_ADDRESS_BSC,
  APEFACTORY_ADDRESS_POLYGON,
  APEFACTORY_INIT_CODE_HASH_BSC,
  APEFACTORY_INIT_CODE_HASH_POLYGON,
} = APEFACTORY_ABI;

interface NetworkData {
  apeFactoryAddress: string;
  apeFactoryInitCodeHash: string;
}

const BSC_DATA: NetworkData = {
  apeFactoryAddress: APEFACTORY_ADDRESS_BSC,
  apeFactoryInitCodeHash: APEFACTORY_INIT_CODE_HASH_BSC,
};

const POLYGON_DATA: NetworkData = {
  apeFactoryAddress: APEFACTORY_ADDRESS_POLYGON,
  apeFactoryInitCodeHash: APEFACTORY_INIT_CODE_HASH_POLYGON,
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  56: BSC_DATA,
  137: POLYGON_DATA,
};

export default class NetworkManager implements NetworkData {
  public apeFactoryAddress: string;
  public apeFactoryInitCodeHash: string;

  constructor() {
    this.apeFactoryAddress = "";
    this.apeFactoryInitCodeHash = "";
  }

  public setNetwork(networkId: number) {
    const { apeFactoryAddress, apeFactoryInitCodeHash } = NETWORK_MAP[networkId];
    this.apeFactoryAddress = apeFactoryAddress;
    this.apeFactoryInitCodeHash = apeFactoryInitCodeHash;
  }
}
