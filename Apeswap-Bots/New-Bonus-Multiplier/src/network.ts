export interface NetworkData {
  masterApe: string;
}

const BSC_MAINNET_DATA: NetworkData = {
  masterApe: "0x5c8D727b265DBAfaba67E050f2f739cAeEB4A6F9",
};

//PoC
const BSC_TESTNET_DATA: NetworkData = {
  masterApe: "0x0EcA8aafad75A618571478B20C2f30Cdd5C577F5",
};

const NETWORK_MAP: Record<number, NetworkData> = {
  56: BSC_MAINNET_DATA,
  97: BSC_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public masterApe: string;

  constructor() {
    this.masterApe = "";
  }

  public setNetwork(networkId: number) {
    const { masterApe } = NETWORK_MAP[networkId];
    this.masterApe = masterApe;
  }
}
