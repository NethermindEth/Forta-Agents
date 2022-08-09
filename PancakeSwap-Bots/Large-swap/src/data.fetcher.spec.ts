import DataFetcher from "./data.fetcher";
import { BigNumber, utils } from "ethers";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { PANCAKE_FACTORY_ADDRESS, INIT_CODE_PAIR_HASH, PANCAKE_PAIR_ABI, ERC20ABI } from "./constants";

//pair, token0, token1, block
const PAIRS: any[][] = [
  [
    "0xb3db622eeca1dd7aae380bfa213b5728945465e6",
    "0x0d420c4f278b70fc62906f8898d7e04dbe601574",
    "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
    1001,
  ],
  [
    "0xeaa54b28fb10735b0ced5f04ea4968d8cbe16622",
    "0xba6ad4af6a81370e9a1ba383ce9ecdd3b6131a6a",
    "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
    900,
  ],
  [
    "0x1199c95ca9c042773b9a384e5623f8e39aff80c8",
    "0x148ec100bd2145314628b8be168ab66fb64c639c",
    "0x2859e4544c4bb03966803b044a93563bd2d0dd4d",
    1212121,
  ],
  [
    "0x07d7734e8c8bdf1be4e3ba42cb552eefc47168c2",
    "0x148ec100bd2145314628b8be168ab66fb64c639c",
    "0x55d398326f99059ff775485246999027b3197955",
    987659999,
  ],
];

//pool, token, balance, block
const BALANCES: any[][] = [
  [createAddress("0xc84a"), createAddress("0xbbcd"), BigNumber.from(12432423423), 10001],
  [createAddress("0xb84a"), createAddress("0x223a"), BigNumber.from(42432423423), 9000],
  [createAddress("0xa84a"), createAddress("0x5343"), BigNumber.from(52432423423), 12102121],
  [createAddress("0xd84a"), createAddress("0x271b"), BigNumber.from(62432423423), 9870659999],
];

describe("PancakeSwap Data Fetcher Test Suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const testFetcher: DataFetcher = new DataFetcher(mockProvider as any);

  beforeEach(() => {
    mockProvider.clear();
  });

  it("should return false for non valid pairs", async () => {
    const invalidPairs: [string, number][] = [
      [createAddress("0xaaab"), 101],
      [createAddress("0xaaac"), 99],
      [createAddress("0xaaad"), 103],
      [createAddress("0xaaae"), 97],
    ];

    for (let [pair, block] of invalidPairs) {
      const [valid, ,] = await testFetcher.isValidPancakePair(
        pair,
        block,
        PANCAKE_FACTORY_ADDRESS,
        INIT_CODE_PAIR_HASH
      );
      expect(valid).toStrictEqual(false);
    }
  });

  it("should return data of correct pairs", async () => {
    for (let [pair, token0, token1, block] of PAIRS) {
      mockProvider.addCallTo(pair, block, new utils.Interface(PANCAKE_PAIR_ABI), "token0", {
        inputs: [],
        outputs: [token0],
      });
      mockProvider.addCallTo(pair, block, new utils.Interface(PANCAKE_PAIR_ABI), "token1", {
        inputs: [],
        outputs: [token1],
      });
      const [valid, t0, t1] = await testFetcher.isValidPancakePair(
        pair,
        block,
        PANCAKE_FACTORY_ADDRESS,
        INIT_CODE_PAIR_HASH
      );
      expect([valid, t0, t1]).toStrictEqual([true, token0, token1]);

      //Use cached values
      mockProvider.clear();
      expect([valid, t0, t1]).toStrictEqual([true, token0, token1]);
    }
  });

  it("should return the called pair's tokens balance", async () => {
    for (let [pair, token, balance, block] of BALANCES) {
      mockProvider.addCallTo(token, block, new utils.Interface(ERC20ABI), "balanceOf", {
        inputs: [pair],
        outputs: [balance],
      });

      const bal = await testFetcher.getERC20Balance(token, pair, block);
      expect(bal).toStrictEqual(balance);

      //Use cached values
      mockProvider.clear();
      expect(bal).toStrictEqual(balance);
    }
  });
});
