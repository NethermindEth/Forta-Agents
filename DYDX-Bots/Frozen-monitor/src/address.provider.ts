export default class AddressProvider {
  networkId: string = "";
  mainnetPrepetualProxy: string;
  ropstenPerpetualProxy: string;

  constructor(mainnetAddress: string, testnetAddress: string) {
    this.mainnetPrepetualProxy = mainnetAddress;
    this.ropstenPerpetualProxy = testnetAddress;
  }

  public setNetwork(networkId: string) {
    this.networkId = networkId;
  }
  public getAddress() {
    switch (this.networkId) {
      case "1":
        return this.mainnetPrepetualProxy;
      case "3":
        return this.ropstenPerpetualProxy;
      default:
        return "";
    }
  }
}
