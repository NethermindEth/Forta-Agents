import { BigNumberish, Contract, providers } from "ethers";
import LRU from "lru-cache";
import { realitioIFace } from "./abi";

type ResultType = Promise<number>;

export default class DataFetcher {
    readonly realitio: string;
    private rContract: Contract;
    readonly provider: providers.Provider;
    private cache: LRU<string, ResultType>;

    constructor(realitio: string, provider: providers.Provider) {
        this.realitio = realitio;
        this.provider = provider;
        this.rContract = new Contract(realitio, realitioIFace, provider);
        this.cache = new LRU<string, ResultType>({max: 10000});
      }

    public async getFinalizeTS(block: number, questionId: string): Promise<number> {
        const key: string = `FinalizeTS-${block}-${questionId}`;
        if(this.cache.has(key))
            return this.cache.get(key) as Promise<number>;

        const finalizeTS: Promise<number> = this.rContract
            .getFinalizeTS(questionId, { blockTag: block });
        this.cache.set(key, finalizeTS);
        return finalizeTS;
    }
}