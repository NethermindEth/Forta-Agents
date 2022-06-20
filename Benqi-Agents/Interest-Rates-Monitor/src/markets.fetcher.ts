import { providers, Contract } from "ethers";
import { COMPTROLLER_IFACE } from "./utils";

export default class MarketsFetcher {
  readonly provider: providers.Provider;
  private comptrollerContract: Contract;
  public markets: string[];

  constructor(provider: providers.Provider, _comptrollerContract: string) {
    this.provider = provider;
    this.markets = [];
    this.comptrollerContract = new Contract(_comptrollerContract, COMPTROLLER_IFACE, provider);
  }

  public async getMarkets(block?: string | number) {
    this.markets = await this.comptrollerContract.getAllMarkets({ blockTag: block });
  }

  public updateMarkets(marketAddress: string) {
    this.markets = [...this.markets, marketAddress];
  }
}
