import PoolFetcher from "./pool.fetcher";
import { BigNumber } from "ethers";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { IFACE_FUNCTIONS } from "./constants";

// pool, token0, token1, totalSupply, block
const POOLS: any[][] = [
  [createAddress("0xaabb"), createAddress("0xaa11"), createAddress("0xbb22"), BigNumber.from(32432423423), 341530],
  [createAddress("0xbbcc"), createAddress("0xcc33"), createAddress("0xdd44"), BigNumber.from(32432423424), 341531],
  [createAddress("0xccdd"), createAddress("0xdd55"), createAddress("0xee66"), BigNumber.from(32432423426), 341532],
  [createAddress("0xff00"), createAddress("0xff11"), createAddress("0xff22"), BigNumber.from(32432423428), 341533],
];

//pool, token0, balance0, token1, balance1, block
const BALANCES: any[][] = [
  [
    createAddress("0xc84a"),
    createAddress("0xbbcd"),
    BigNumber.from(12432423423),
    createAddress("0xb3a4"),
    BigNumber.from(62432423423),
    341530,
  ],
  [
    createAddress("0xb84a"),
    createAddress("0x223a"),
    BigNumber.from(42432423423),
    createAddress("0xb3a5"),
    BigNumber.from(72432423424),
    341531,
  ],
  [
    createAddress("0xa84a"),
    createAddress("0x5343"),
    BigNumber.from(52432423423),
    createAddress("0xb3a6"),
    BigNumber.from(82432423426),
    341532,
  ],
  [
    createAddress("0xd84a"),
    createAddress("0x271b"),
    BigNumber.from(62432423423),
    createAddress("0xb3a7"),
    BigNumber.from(92432423428),
    341533,
  ],
];

describe("Pancakeswap Pool Fetcher Test Suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const testFetcher: PoolFetcher = new PoolFetcher(mockProvider as any);

  beforeEach(() => {
    mockProvider.clear();
  });

  it("should return false for non valid pools", async () => {
    const invalidPools: [string, number][] = [
      [createAddress("0xaaff"), 80],
      [createAddress("0xbbff"), 90],
      [createAddress("0xccff"), 101],
      [createAddress("0xddff"), 201],
    ];

    for (let [pool, block] of invalidPools) {
      const [valid, , ,] = await testFetcher.getPoolData(block, pool);
      expect(valid).toStrictEqual(false);
    }
  });

  it("should return data of correct pairs", async () => {
    for (let [pool, token0, token1, supply, block] of POOLS) {
      mockProvider.addCallTo(pool, block, IFACE_FUNCTIONS, "token0", {
        inputs: [],
        outputs: [token0],
      });
      mockProvider.addCallTo(pool, block, IFACE_FUNCTIONS, "token1", {
        inputs: [],
        outputs: [token1],
      });
      mockProvider.addCallTo(pool, block, IFACE_FUNCTIONS, "totalSupply", {
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
      mockProvider.addCallTo(token0, block, IFACE_FUNCTIONS, "balanceOf", {
        inputs: [pool],
        outputs: [balance0],
      });
      mockProvider.addCallTo(token1, block, IFACE_FUNCTIONS, "balanceOf", {
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