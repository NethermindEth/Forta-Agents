import { Contract, providers } from "ethers";
import { oracleIFace, moduleIFace } from "./abi";

export default class DataFetcher {
    readonly moduleAddress: string;
    readonly provider: providers.Provider;
    private moduleContract: Contract;

    constructor(
        moduleAddress: string,
        provider: providers.Provider
    ) {
        this.moduleAddress = moduleAddress;
        this.provider = provider;
        this.moduleContract = new Contract(moduleAddress, moduleIFace, provider);
    }

    public async getOracle(blockNumber: number): Promise<string> {
        const oracleAddress: string = await this.moduleContract
            .oracle({ blockTag: blockNumber });
        return oracleAddress.toLowerCase();
    }

    public async getFinalizeTS(
        blockNumber: number,
        oracleAddress: string,
        questionId: string
    ): Promise<number> {
       const oracleContract: Contract = new Contract(oracleAddress, oracleIFace, this.provider);
       const finalizeTS: number = await oracleContract.getFinalizeTS(questionId, { blockTag: blockNumber });
       return finalizeTS;
    }
}