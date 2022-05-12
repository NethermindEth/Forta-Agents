interface NetworkData {
  banana: string;
  gnana: string;
}

const BSC_MAINNET_DATA: NetworkData = {
  banana: "0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95",
  gnana: "0xddb3bd8645775f59496c821e4f55a7ea6a6dc299",
};

const BSC_TESTNET_DATA: NetworkData = {
  banana: "0xd11e6e37acc7e5f4063ecace780a2b789528159c", //PoC
  gnana: "0x1398ddbc64f9e8a844da6c025a3a46c47e22f376", //PoC
};

const POLYGON_MAINNET_DATA: NetworkData = {
  banana: "0x5d47baba0d66083c52009271faf3f50dcc01023c",
  gnana: "0x0000000000000000000000000000000000000000", //contract doesn't exist on Polygon
};

const POLYGON_TESTNET_DATA: NetworkData = {
  banana: "0xdbe0cb68b96c0b6c12646ed11f8068b62f88b945", //PoC
  gnana: "0x0000000000000000000000000000000000000000", //contract doesn't exist on Polygon
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  56: BSC_MAINNET_DATA,
  97: BSC_TESTNET_DATA,
  137: POLYGON_MAINNET_DATA,
  80001: POLYGON_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public banana: string;
  public gnana: string;
  public networkId: number;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.banana = "";
    this.gnana = "";
    this.networkId = 0;
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    const { banana, gnana } = this.networkMap[networkId];
    this.networkId = networkId;
    this.banana = banana;
    this.gnana = gnana;
  }
}
