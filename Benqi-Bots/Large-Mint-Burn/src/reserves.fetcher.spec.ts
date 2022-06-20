import ReservesFetcher from "./reserves.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { RESERVES_FUNCTION } from "./utils";

//Data used for tests [blockNumber, reserve0, reserve1, blockTimestampLast]
const TEST_DATA: [number, BigNumber, BigNumber, number][] = [
  [10, BigNumber.from(50), BigNumber.from(70), 2253],
  [20, BigNumber.from(80), BigNumber.from(100), 5463],
  [30, BigNumber.from(100), BigNumber.from(150), 3784],
  [40, BigNumber.from(120), BigNumber.from(200), 3748],
  [50, BigNumber.from(240), BigNumber.from(250), 9374],
];
const contract = createAddress("0xa1");

describe("reservesFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const fetcher: ReservesFetcher = new ReservesFetcher(mockProvider as any, contract);

  const initialize = () => {
    for (let [block, reserve0, reserve1, blockTimestampLast] of TEST_DATA) {
      mockProvider.addCallTo(contract, block, RESERVES_FUNCTION, "getReserves", {
        inputs: [],
        outputs: [reserve0, reserve1, blockTimestampLast],
      });
    }
  };

  beforeEach(() => mockProvider.clear());

  it("should fetch the reserves and use cache correctly", async () => {
    initialize();

    for (let [block, reserve0, reserve1] of TEST_DATA) {
      const [value0, value1] = await fetcher.getReserves(block);
      expect([value0, value1]).toStrictEqual([reserve0, reserve1]);
    }

    // clear mock to use cache
    mockProvider.clear();
    for (let [block, reserve0, reserve1] of TEST_DATA) {
      const [value0, value1] = await fetcher.getReserves(block);
      expect([value0, value1]).toStrictEqual([reserve0, reserve1]);
    }
  });
});
