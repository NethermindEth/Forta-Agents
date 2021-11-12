import LRU from 'lru-cache';
import { AbiItem } from "web3-utils";
import { decodeParameters, encodeFunctionCall } from "forta-agent-tools";

type BlockId = string | number; 

export const VAULT_ABI: AbiItem = {
  name: "assetsAddresses",
  type: "function",
  inputs: [],
  outputs: [{
    name: "vaults",
    type: "address[]",
  }],
};

export default class ValutsFetcher {
  private cache: LRU<BlockId, string[]>;
  private provider: string;
  private web3: any;

  constructor(provider: string, web3: any) {
    this.cache = new LRU<BlockId, string[]>({max: 10_000});
    this.provider = provider;
    this.web3 = web3;
  }

  public async getVaults(block: BlockId = "latest"): Promise<string[]> {
    if(block !== "latest" && this.cache.get(block) !== undefined)
      return this.cache.get(block) as string[];
    
    const encodedData = await this.web3.call({
      to: this.provider,
      data: encodeFunctionCall(VAULT_ABI, []),
    }, block);

    const { vaults } = decodeParameters(VAULT_ABI.outputs as any[], encodedData);
    const vaultsInLower: string[] = vaults.map((v: string) => v.toLowerCase());
    this.cache.set(block, vaultsInLower);
    return vaultsInLower;
  } 
};
