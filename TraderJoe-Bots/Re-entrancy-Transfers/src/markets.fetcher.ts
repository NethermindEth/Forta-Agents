import { providers, Contract } from "ethers";
import { MARKETS_IFACE } from "./utils";

export default class MarketsFetcher {
  provider: providers.Provider;
  markets: Set<string>;
  joeTrollerAddress: string;
  joeTrollerContract: Contract;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.markets = new Set();
    this.joeTrollerAddress = "0x0000000000000000000000000000000000000000";
    this.joeTrollerContract = new Contract(this.joeTrollerAddress, MARKETS_IFACE, this.provider);
  }

  public setJoeTrollerContract(joeTrollerAddress: string) {
    if (this.joeTrollerContract.address != joeTrollerAddress) {
      this.joeTrollerAddress = joeTrollerAddress;
      this.joeTrollerContract = new Contract(joeTrollerAddress, MARKETS_IFACE, this.provider);
    }
  }

  // fetch add the markets from JoeTroller contract. Called Once.
  public async getMarkets(block: number | string): Promise<Set<string>> {
    this.markets = new Set(
      await this.joeTrollerContract.getAllMarkets({
        blockTag: block,
      })
    );

    return this.markets;
  }
  // Updates the set of markets when `MarketListed` `MarketDelisted` events are detected.
  public updateMarkets(eventName: string, marketAddress: string) {
    if (eventName === "MarketListed") {
      this.markets.add(marketAddress);
    } else {
      this.markets.delete(marketAddress);
    }
  }
}
