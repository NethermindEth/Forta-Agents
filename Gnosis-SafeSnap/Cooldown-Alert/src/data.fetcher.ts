import { BigNumberish, Contract, providers, utils } from "ethers";
import LRU from "lru-cache";
import { realitioAbi } from "./abi";

type ResultType = Promise<string[] | string>;

export default class DataFetcher {
    readonly realitio: string;
    private rContract: Contract;
    readonly provider: providers.Provider;
    private cache: LRU<string, ResultType>;

    constructor(realitio: string, provider: providers.Provider) {
        this.realitio = realitio;
        this.provider = provider;
        this.rContract = new Contract(realitio, realitioAbi, provider);
        this.cache = new LRU<string, ResultType>({max: 10000});
      }
}