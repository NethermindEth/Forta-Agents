interface NetworkData {
    factory: string;
  }
  const POLYGON_MAINNET_DATA: NetworkData = {
    factory: "0xCf083Be4164828f00cAE704EC15a36D711491284",
  };
  
  const BSC_MAINNET_DATA: NetworkData = {
    factory: "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6",
  };
  
  //PoC
  const BSC_TESTNET_DATA: NetworkData = {
    factory: "0xE115b296916E63C74E01506d37c6CF2C9fBaa9E0",
  };
  
  const NETWORK_MAP: Record<number, NetworkData> = {
    56: BSC_MAINNET_DATA,
    137: POLYGON_MAINNET_DATA,
    97: BSC_TESTNET_DATA,
  };
  
  export default class NetworkManager implements NetworkData {
    public factory: string;
  
    constructor() {
      this.factory = "";
    }
  
    public setNetwork(networkId: number) {
      const { factory } = NETWORK_MAP[networkId];
      this.factory = factory;
    }
  }
  