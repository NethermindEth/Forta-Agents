interface NetworkData {
  factory: string;
  init: string;
}
const POLYGON_MAINNET_DATA: NetworkData = {
  factory: "0xCf083Be4164828f00cAE704EC15a36D711491284",
  init: "0x511f0f358fe530cda0859ec20becf391718fdf5a329be02f4c95361f3d6a42d8",
};

const BSC_MAINNET_DATA: NetworkData = {
  factory: "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6",
  init: "0xf4ccce374816856d11f00e4069e7cada164065686fbef53c6167a63ec2fd8c5b",
};

const NETWORK_MAP: Record<number, NetworkData> = {
  56: BSC_MAINNET_DATA,
  137: POLYGON_MAINNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public factory: string;
  public init: string;

  constructor() {
    this.factory = "";
    this.init = "";
  }

  public setNetwork(networkId: number) {
    const { factory, init } = NETWORK_MAP[networkId];
    this.factory = factory;
    this.init = init;
  }
}
