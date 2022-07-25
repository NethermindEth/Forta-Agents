import PairFetcher from "./pair.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import abi from "./abi";

const V2_PAIRS: string[][] = [
  // addr, token0, token1
  [createAddress("0xdef101"), createAddress("0x1dea01"), createAddress("0x1dea02")],
  [createAddress("0xdef102"), createAddress("0x1dea03"), createAddress("0x1dea06")],
  [createAddress("0xdef103"), createAddress("0x1dea04"), createAddress("0x1dea05")],
  [createAddress("0xdef104"), createAddress("0x1dea08"), createAddress("0x1dea07")],
  [createAddress("0xdef105"), createAddress("0x1dea10"), createAddress("0x1dea09")],
];

const V3_PAIRS: any[][] = [
  // addr, token0, token1, fee
  [createAddress("0xdef106"), createAddress("0x1dea15"), createAddress("0x1dea16"), 1],
  [createAddress("0xdef107"), createAddress("0x1dea14"), createAddress("0x1dea17"), 21231],
  [createAddress("0xdef108"), createAddress("0x1dea13"), createAddress("0x1dea18"), 12],
  [createAddress("0xdef109"), createAddress("0x1dea12"), createAddress("0x1dea19"), 1111],
  [createAddress("0xdef110"), createAddress("0x1dea11"), createAddress("0x1dea20"), 90],
];

describe("PairFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const fetcher: PairFetcher = new PairFetcher(mockProvider as any);

  const prepare = (block: number) => {
    for (let [addr, t0, t1] of [...V2_PAIRS, ...V3_PAIRS]) {
      mockProvider.addCallTo(addr, block, abi.COMMON_IFACE, "token0", {
        inputs: [],
        outputs: [t0],
      });
      mockProvider.addCallTo(addr, block, abi.COMMON_IFACE, "token1", {
        inputs: [],
        outputs: [t1],
      });
    }
    for (let [addr, , , fee] of V3_PAIRS) {
      mockProvider.addCallTo(addr, block, abi.COMMON_IFACE, "fee", {
        inputs: [],
        outputs: [fee],
      });
    }
  };

  beforeEach(() => mockProvider.clear());

  it("should return false for non pairs", async () => {
    const nonPairs: [string, number][] = [
      // addr, blockNumber
      [createAddress("0xdead"), 23],
      [createAddress("0xf00"), 91289],
      [createAddress("0xe0a"), 12],
      [createAddress("0xdef1"), 987],
    ];

    for (let [addr, block] of nonPairs) {
      const [validV2, , ,] = await fetcher.getV2Data(addr, block);
      expect(validV2).toStrictEqual(false);
      const [validV3, , , ,] = await fetcher.getV3Data(addr, block + 1);
      expect(validV3).toStrictEqual(false);
    }
  });

  it("should return the correct values of valid pairs", async () => {
    const blocks: number[] = [13, 21412, 12, 2, 456];

    for (let block of blocks) {
      prepare(block);
      for (let [addr, ...data] of V2_PAIRS) {
        const values = await fetcher.getV2Data(addr, block);
        expect(values).toStrictEqual([true, ...data]);
      }
      for (let [addr, ...data] of V3_PAIRS) {
        const values = await fetcher.getV3Data(addr, block);
        expect(values).toStrictEqual([true, ...data]);
      }
      // clear block and use cache
      mockProvider.clear();
      for (let [addr, ...data] of V2_PAIRS) {
        const values = await fetcher.getV2Data(addr, block);
        expect(values).toStrictEqual([true, ...data]);
      }
      for (let [addr, ...data] of V3_PAIRS) {
        const values = await fetcher.getV3Data(addr, block);
        expect(values).toStrictEqual([true, ...data]);
      }
    }
  });
});
