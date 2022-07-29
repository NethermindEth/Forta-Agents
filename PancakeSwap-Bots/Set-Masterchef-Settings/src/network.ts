interface NetworkData {
  masterChef: string;
}

const BSC_MAINNET_DATA: NetworkData = {
  masterChef: "0x73feaa1eE314F8c655E354234017bE2193C9E24E",
};

//PoC
const BSC_TESTNET_DATA: NetworkData = {
  masterChef: "0xbD315DA028B586f7cD93903498e671fA3efeF506",
};

const NETWORK_MAP: Record<number, NetworkData> = {
  56: BSC_MAINNET_DATA,
  97: BSC_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public masterChef: string;

  constructor() {
    this.masterChef = "";
  }

  public setNetwork(networkId: number) {
    const { masterChef } = NETWORK_MAP[networkId];
    this.masterChef = masterChef;
  }
}
