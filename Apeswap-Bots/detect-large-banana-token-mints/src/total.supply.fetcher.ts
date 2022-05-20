import { BigNumber, Contract, providers } from "ethers";
import NetworkData from "./network";
import { BANANA_CONSTANTS } from "./constants";

const { BANANA_TOTAL_SUPPLY_ABI } = BANANA_CONSTANTS;

export default class TotalSupplyFetcher {
  provider: providers.Provider;
  private networkManager: NetworkData;
  bananaContract: Contract;

  constructor(provider: providers.Provider, networkManager: NetworkData) {
    this.provider = provider;
    this.networkManager = networkManager;
    this.bananaContract = new Contract(networkManager.bananaAddress, BANANA_TOTAL_SUPPLY_ABI, provider);
  }

  public setBananaContract() {
    if (this.bananaContract.address != this.networkManager.bananaAddress) {
      this.bananaContract = new Contract(this.networkManager.bananaAddress, BANANA_TOTAL_SUPPLY_ABI, this.provider);
    }
  }

  public async getTotalSupply(block: number): Promise<BigNumber> {
    const totalSupply: Promise<BigNumber> = await this.bananaContract.totalSupply({ blockTag: block });
    return totalSupply;
  }
}
