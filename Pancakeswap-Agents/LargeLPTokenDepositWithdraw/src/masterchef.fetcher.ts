import { providers, Contract, BigNumber } from "ethers";
import { MASTERCHEF_ABI } from "./constants";

export default class MasterchefFetcher {

    readonly provider: providers.Provider;
    private masterchefContract: Contract;

    constructor(provider: providers.Provider, masterchefAddress: string) {
        this.provider = provider;
        this.masterchefContract = new Contract(masterchefAddress, MASTERCHEF_ABI, provider);
    }

    public async getLPToken(pid: string | number, block: string | number) {
        const lpToken = await this.masterchefContract.lpToken(pid, { blockTag: block });
        return lpToken;
    }

}