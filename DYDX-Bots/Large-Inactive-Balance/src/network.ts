interface NetworkData {
  safetyModule: string;
  dydxAddress: string;
}

const ETH_MAINNET_DATA: NetworkData = {
  safetyModule: "0x65f7BA4Ec257AF7c55fd5854E5f6356bBd0fb8EC",
  dydxAddress: "0x92d6c1e31e14520e676a687f0a93788b716beff5",
};

const ROPSTEN_TESTNET_DATA: NetworkData = {
  // TODO: Change once PoC deployed
  safetyModule: "0x65f7BA4Ec257AF7c55fd5854E5f6356bBd0fb8EC",
  dydxAddress: "0x92d6c1e31e14520e676a687f0a93788b716beff5",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  1: ETH_MAINNET_DATA,
  3: ROPSTEN_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public safetyModule: string;
  public dydxAddress: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.safetyModule = "";
    this.dydxAddress = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    const { safetyModule, dydxAddress } = this.networkMap[networkId];
    this.safetyModule = safetyModule;
    this.dydxAddress = dydxAddress;
  }
}
