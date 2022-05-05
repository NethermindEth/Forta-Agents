interface NetworkData {
  masterApe: string;
  masterApeAdmin: string;
  miniApeV2: string;
  miniComplexRewarderTime: string;
}
const BSC_MAINNET_DATA: NetworkData = {
  masterApe: "0x5c8D727b265DBAfaba67E050f2f739cAeEB4A6F9",
  masterApeAdmin: "0x9fed2bc7f0b4f4350b52e29e0a3c2bf5ebc3cc0a",
  miniApeV2: "0x0000000000000000000000000000000000000000",
  miniComplexRewarderTime: "0x0000000000000000000000000000000000000000",
};

const BSC_TESTNET_DATA: NetworkData = {
  masterApe: "0x062cdBba9348d65BD225e90224159d1e2d4326D8",
  masterApeAdmin: "0x22fdC4d8eEea0d219E15025d2BCDe38d948e9A13",
  miniApeV2: "0x0000000000000000000000000000000000000000",
  miniComplexRewarderTime: "0x0000000000000000000000000000000000000000",
};

const POLYGON_MAINNET_DATA: NetworkData = {
  masterApe: "0x0000000000000000000000000000000000000000",
  masterApeAdmin: "0x0000000000000000000000000000000000000000",
  miniApeV2: "0x54aff400858dcac39797a81894d9920f16972d1d",
  miniComplexRewarderTime: "0x1f234b1b83e21cb5e2b99b4e498fe70ef2d6e3bf",
};

const NETWORK_MAP: Record<number, NetworkData> = {
  56: BSC_MAINNET_DATA,
  97: BSC_TESTNET_DATA,
  137: POLYGON_MAINNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public masterApe: string;
  public masterApeAdmin: string;
  public miniApeV2: string;
  public miniComplexRewarderTime: string;

  constructor() {
    this.masterApe = "";
    this.masterApeAdmin = "";
    this.miniApeV2 = "";
    this.miniComplexRewarderTime = "";
  }

  public setNetwork(networkId: number) {
    const { masterApe, masterApeAdmin, miniApeV2, miniComplexRewarderTime } = NETWORK_MAP[networkId];
    this.masterApe = masterApe;
    this.masterApeAdmin = masterApeAdmin;
    this.miniApeV2 = miniApeV2;
    this.miniComplexRewarderTime = miniComplexRewarderTime;
  }
}
