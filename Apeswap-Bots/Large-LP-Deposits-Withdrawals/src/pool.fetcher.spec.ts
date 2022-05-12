import PoolFetcher from "./pool.fetcher";
import { BigNumber } from "ethers";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import utils from "./utils";

//pool, token0, token1, totalSupply, block
const POOLS: any[][] = [
  [createAddress("0xabcd"), createAddress("0x987a"), createAddress("0xa3a4"), BigNumber.from(32432423423), 1001],
  [createAddress("0x123a"), createAddress("0x986a"), createAddress("0xa3a5"), BigNumber.from(32432423424), 900],
  [createAddress("0x4343"), createAddress("0x985a"), createAddress("0xa3a6"), BigNumber.from(32432423426), 1212121],
  [createAddress("0x171b"), createAddress("0x984a"), createAddress("0xa3a7"), BigNumber.from(32432423428), 987659999],
];

//pool, token0, balance0, token1, balance1, block
const BALANCES: any[][] = [
  [
    createAddress("0xc84a"),
    createAddress("0xbbcd"),
    BigNumber.from(12432423423),
    createAddress("0xb3a4"),
    BigNumber.from(62432423423),
    10001,
  ],
  [
    createAddress("0xb84a"),
    createAddress("0x223a"),
    BigNumber.from(42432423423),
    createAddress("0xb3a5"),
    BigNumber.from(72432423424),
    9000,
  ],
  [
    createAddress("0xa84a"),
    createAddress("0x5343"),
    BigNumber.from(52432423423),
    createAddress("0xb3a6"),
    BigNumber.from(82432423426),
    12102121,
  ],
  [
    createAddress("0xd84a"),
    createAddress("0x271b"),
    BigNumber.from(62432423423),
    createAddress("0xb3a7"),
    BigNumber.from(92432423428),
    9870659999,
  ],
];

describe("Apeswap pool fetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const testFetcher: PoolFetcher = new PoolFetcher(mockProvider as any);

  beforeEach(() => {
    mockProvider.clear();
  });

  it("should return false for non valid pools", async () => {
    const invalidPools: [string, number][] = [
      [createAddress("0xaaab"), 101],
      [createAddress("0xaaac"), 99],
      [createAddress("0xaaad"), 103],
      [createAddress("0xaaae"), 97],
    ];

    for (let [pool, block] of invalidPools) {
      const [valid, , ,] = await testFetcher.getPoolData(block, pool);
      expect(valid).toStrictEqual(false);
    }
  });

  it("should return data of correct pairs", async () => {
    for (let [pool, token0, token1, supply, block] of POOLS) {
      mockProvider.addCallTo(pool, block, utils.FUNCTIONS_IFACE, "token0", {
        inputs: [],
        outputs: [token0],
      });
      mockProvider.addCallTo(pool, block, utils.FUNCTIONS_IFACE, "token1", {
        inputs: [],
        outputs: [token1],
      });
      mockProvider.addCallTo(pool, block, utils.FUNCTIONS_IFACE, "totalSupply", {
        inputs: [],
        outputs: [supply],
      });

      const [valid, t0, t1, sup] = await testFetcher.getPoolData(block, pool);
      expect([valid, t0, t1, sup]).toStrictEqual([true, token0, token1, supply]);

      //Use cached values
      mockProvider.clear();
      expect([valid, t0, t1, sup]).toStrictEqual([true, token0, token1, supply]);
    }
  });

  it("should return the called pool's tokens balance", async () => {
    for (let [pool, token0, balance0, token1, balance1, block] of BALANCES) {
      mockProvider.addCallTo(token0, block, utils.FUNCTIONS_IFACE, "balanceOf", {
        inputs: [pool],
        outputs: [balance0],
      });
      mockProvider.addCallTo(token1, block, utils.FUNCTIONS_IFACE, "balanceOf", {
        inputs: [pool],
        outputs: [balance1],
      });

      const [bal0, bal1] = await testFetcher.getPoolBalance(block, pool, token0, token1);
      expect(bal0).toStrictEqual(balance0);
      expect(bal1).toStrictEqual(balance1);

      //Use cached values
      mockProvider.clear();
      expect(bal0).toStrictEqual(balance0);
      expect(bal1).toStrictEqual(balance1);
    }
  });
});
