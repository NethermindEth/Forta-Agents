import abi from "./abi";
import { encodeFunctionCall, decodeParameters } from "forta-agent-tools";
import LRU from "lru-cache";

type BlockId = string | number;

export interface TokenData {
  symbol: string,
  address: string,
};

export default class AeveFetcher {
  private web3Call: any;
  private contract: string;
  private cache: LRU<BlockId, TokenData[]>;

  constructor(web3Call: any, contract: string){
    this.web3Call = web3Call;
    this.contract = contract;
    this.cache = new LRU<BlockId, TokenData[]>({max: 10_000});
  }

  public async getTokens(block: number | string = "latest"): Promise<TokenData[]> {
    if(block !== "latest" && this.cache.get(block) !== undefined)
      return this.cache.get(block) as TokenData[];
    
    const encodedData = await this.web3Call({
      to: this.contract,
      data: encodeFunctionCall(abi.GET_ALL_ATOKENS, []),
    }, block);

    const { tokens } = decodeParameters(abi.GET_ALL_ATOKENS.outputs as any[], encodedData);
    const _tokens: TokenData[] = tokens.map((token: any) => {
      return {
        symbol: token.symbol,
        address: token.address,
      }
    })
    this.cache.set(block, _tokens);
    return _tokens;
  }
};
