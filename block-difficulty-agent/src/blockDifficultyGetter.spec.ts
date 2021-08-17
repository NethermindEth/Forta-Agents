import BlockDifficultyGetter from "./blockDifficultyGetter";


describe("BlockDifficultyGetter tests", () => {
    const mockWeb3 = jest.fn(blockNumber => {
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

    it("should return correct value", () => {
        const getter: BlockDifficultyGetter = new BlockDifficultyGetter(mockWeb3);
        expect(getter.getDifficulty(121212)).toStrictEqual(13000);
        expect(getter.getDifficulty(131313)).toStrictEqual(15000);
    });
});