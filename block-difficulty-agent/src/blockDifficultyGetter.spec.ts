import BlockDifficultyGetter from "./blockDifficultyGetter";
import Web3 from "web3";


describe("BlockDifficultyGetter tests", () => {
    const mockGetBlockFn = jest.fn(blockNumber => {
        const blocksByNumber: {[key: number]: any} = {
            121212: {
                difficulty: 13000
            },
            131313: {
                difficulty: 15000
            }
        }
        return blocksByNumber[blockNumber];
    });

    const mockWeb3: any = {
        eth: {
            getBlock: mockGetBlockFn
        }
    };

    it("should return correct difficulty per block", async () => {
        const getter: BlockDifficultyGetter = new BlockDifficultyGetter(mockWeb3 as Web3);
        expect(await getter.getDifficulty(121212)).toStrictEqual(13000);
        expect(await getter.getDifficulty(131313)).toStrictEqual(15000);
    });
});