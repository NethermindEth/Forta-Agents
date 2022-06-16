import { ethers } from "forta-agent";

export default class NetworkManager<T extends Record<any, any>> {
  private chainId: number = -1;

  constructor (
    public networkMap: Record<number, T>,
    public provider: ethers.providers.Provider,
    chainId?: number,
  ) {
    if (chainId !== undefined) {
      this.network = chainId;
    }
  }

  get network() {
    return this.chainId;
  }

  set network(chainId: number) {
    if (!this.networkMap[chainId]) {
      throw new Error(`The network with ID ${chainId} is not supported`);
    }

    this.chainId = chainId;
  }

  public async init() {
    const { chainId } = await this.provider.getNetwork();

    this.network = chainId;
  }

  public get<K extends keyof T>(key: K): T[K] {
    if (this.chainId === -1) throw new Error("NetworkManager was not initialized");

    return this.networkMap[this.chainId][key];
  }
}
