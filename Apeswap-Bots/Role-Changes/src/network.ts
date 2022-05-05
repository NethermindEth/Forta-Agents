interface NetworkData {
    masterApe: string;
    masterApeAdmin: string;
  }
  const BSC_MAINNET_DATA: NetworkData = {
    masterApe: "0x5c8D727b265DBAfaba67E050f2f739cAeEB4A6F9",
    masterApeAdmin: "0x9fed2bc7f0b4f4350b52e29e0a3c2bf5ebc3cc0a",
  };
  
  const BSC_TESTNET_DATA: NetworkData = {
    masterApe: "0x062cdBba9348d65BD225e90224159d1e2d4326D8",
    masterApeAdmin: "0x22fdC4d8eEea0d219E15025d2BCDe38d948e9A13",
  };
  
  const NETWORK_MAP: Record<number, NetworkData> = {
    56: BSC_MAINNET_DATA,
    97: BSC_TESTNET_DATA,
  };
  
  export default class NetworkManager implements NetworkData {
    public masterApe: string;
    public masterApeAdmin: string;
  
    constructor() {
      this.masterApe = "";
      this.masterApeAdmin = "";
    }
  
    public setNetwork(networkId: number) {
      const { masterApe, masterApeAdmin } = NETWORK_MAP[networkId];
      this.masterApe = masterApe;
      this.masterApeAdmin = masterApeAdmin;
    }
  }