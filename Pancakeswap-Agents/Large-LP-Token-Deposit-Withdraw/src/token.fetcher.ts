import { providers, Contract } from "ethers";
import { IBEP20_ABI } from "./constants";

export default class TokenFetcher {

    readonly provider: providers.Provider;
    private tokenContract: Contract;

    constructor(provider: providers.Provider, tokenAddress: string) {
        this.provider = provider;
        this.tokenContract = new Contract(tokenAddress, IBEP20_ABI, provider);
    }

    public async getName(block: string | number) {
        const name = await this.tokenContract.name({ blockTag: block });
        return name;
    }

    public async getBalanceOf(masterchefAddress: string, block: string | number) {
        const balance = await this.tokenContract.balanceOf(masterchefAddress, { blockTag: block });
        return balance;
    }

}