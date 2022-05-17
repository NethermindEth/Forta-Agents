import { providers, Contract, BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import LRU from "lru-cache";
import { ERC20_TOKEN_ABI } from "./utils";
import NetworkData from "./network";

export default class BalanceFetcher {
  provider: providers.Provider;
  private cache: LRU<string, BigNumber>;
  networkManager: NetworkData;
  assetType: BigNumber;
  tokenAddress: string;
  private tokenContract: Contract;

  constructor(provider: providers.Provider, networkManager: NetworkData) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber>({
      max: 10000,
    });
    this.networkManager = networkManager;
    this.assetType = BigNumber.from(0);
    this.tokenAddress = "";
    this.tokenContract = new Contract(this.tokenAddress, new Interface(ERC20_TOKEN_ABI), this.provider);
  }

  public setData(_assetType: BigNumber, _tokenAddress: string) {
    this.assetType = _assetType;
    this.tokenAddress = _tokenAddress;
    if (this.tokenContract.address != this.tokenAddress)
      this.tokenContract = new Contract(this.tokenAddress, new Interface(ERC20_TOKEN_ABI), this.provider);
  }

  public async getBalance(block: number | string): Promise<BigNumber> {
    const key: string = `${this.tokenAddress} - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;

    const balance: BigNumber = this.tokenContract.balanceOf(this.networkManager.perpetualProxy, {
      blockTag: block,
    });

    this.cache.set(key, balance);
    return balance;
  }
}
