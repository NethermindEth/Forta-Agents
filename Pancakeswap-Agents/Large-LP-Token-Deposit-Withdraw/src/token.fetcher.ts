import { providers, Contract, BigNumber } from "ethers";
import LRU from "lru-cache";
import { IBEP20_ABI } from "./constants";

export default class TokenFetcher {

    readonly provider: providers.Provider;
    private balanceOfCache: LRU<string, BigNumber>;
    private tokenContract: Contract;

    constructor(provider: providers.Provider, tokenAddress: string) {
        this.provider = provider;
        this.balanceOfCache = new LRU<string, BigNumber>({max: 1000});
        this.tokenContract = new Contract(tokenAddress, IBEP20_ABI, provider);
    }

    public async getBalanceOf(masterchefAddress: string, block: string | number) {
        const key : string = `${masterchefAddress}-${block}`
        if (this.balanceOfCache.has(key)) return this.balanceOfCache.get(key) as BigNumber;
        const balance = await this.tokenContract.balanceOf(masterchefAddress, { blockTag: block });
        this.balanceOfCache.set(key, balance);
        return balance;
    }

}