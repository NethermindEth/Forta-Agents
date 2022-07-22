import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { IBEP20_ABI } from "./constants";

export default class TokenFetcher {

    readonly provider: providers.Provider;
    private nameCache: LRU<string, string>;
    private balanceOfCache: LRU<string, BigNumber>;
    private tokenContract: Contract;

    constructor(provider: providers.Provider, tokenAddress: string) {
        this.provider = provider;
        this.nameCache = new LRU<string, string>({max: 1000});
        this.balanceOfCache = new LRU<string, BigNumber>({max: 1000});
        this.tokenContract = new Contract(tokenAddress, IBEP20_ABI, provider);
    }

    public async getName(block: string | number) {
        const key : string = `${block}`;
        if (this.nameCache.has(key)) return this.nameCache.get(key) as string;
        const name = await this.tokenContract.name({ blockTag: block });
        this.nameCache.set(key, name);
        return name;
    }

    public async getBalanceOf(masterchefAddress: string, block: string | number) {
        const key : string = `${masterchefAddress}-${block}`
        if (this.balanceOfCache.has(key)) return this.balanceOfCache.get(key) as BigNumber;
        const balance = await this.tokenContract.balanceOf(masterchefAddress, { blockTag: block });
        this.balanceOfCache.set(key, balance);
        return balance;
    }

}