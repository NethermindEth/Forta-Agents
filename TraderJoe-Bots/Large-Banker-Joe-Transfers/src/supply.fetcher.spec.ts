import { BigNumber } from "ethers";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import SupplyFetcher from "./supply.fetcher";
import { SUPPLY_IFACE } from "./utils";

//Data used for tests [blockNumber, Jtoken, supply]
const TEST_DATA: [number, string, BigNumber][] = [
  [10, createAddress("0x31"), BigNumber.from(100)],
  [10, createAddress("0x41"), BigNumber.from(200)],
  [20, createAddress("0x31"), BigNumber.from(300)],
  [20, createAddress("0x41"), BigNumber.from(400)],
  [30, createAddress("0x31"), BigNumber.from(500)],
  [30, createAddress("0x41"), BigNumber.from(600)],
];

describe("SupplyFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const fetcher: SupplyFetcher = new SupplyFetcher(mockProvider as any);

  beforeAll(() => {
    for (let [block, jToken, supply] of TEST_DATA) {
      mockProvider.addCallTo(jToken, block, SUPPLY_IFACE, "totalSupply", {
        inputs: [],
        outputs: [supply],
      });
    }
  });

  it("should fetch totalSupply for each contract correctly", async () => {
    for (let [block, jToken, supply] of TEST_DATA) {
      const fetchedSupply = await fetcher.getTotalSupply(jToken, block);
      expect(fetchedSupply).toStrictEqual(supply);
    }
  });
});
