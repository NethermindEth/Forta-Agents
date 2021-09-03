import LRU from "lru-cache";
import Web3 from "web3";

const cache = new LRU({ max: 10_000});


export default class BlockDifficultyGetter {
    readonly web3: Web3;

    constructor(web3: Web3) {
        this.web3 = web3;
    }

    private async fetchBlockDifficulty(blockNumber: number): Promise<number> {
        const block = await this.web3.eth.getBlock(blockNumber);
        const difficulty = block.difficulty;
        cache.set(blockNumber, difficulty);
        return difficulty
    }

    public async getDifficulty(blockNumber: number): Promise<number> {
        let difficulty = cache.get(blockNumber);
        if (difficulty === undefined) {
            difficulty = await this.fetchBlockDifficulty(blockNumber);
        }
        return difficulty as number;
    }
}