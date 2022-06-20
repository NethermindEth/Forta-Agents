import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import MarketsFetcher from "./markets.fetcher";
import { COMPTROLLER_IFACE } from "./utils";

describe("Markets Fetcher test suite", () => {
  // foramat: [comptroller, markets]
  const TEST_CASES: [string, string, string, string][] = [
    [createAddress("0xa1"), createAddress("0x1"), createAddress("0x12"), createAddress("0x123")],
    [createAddress("0xa2"), createAddress("0x2"), createAddress("0x22"), createAddress("0x223")],
    [createAddress("0xa3"), createAddress("0x3"), createAddress("0x32"), createAddress("0x323")],
    [createAddress("0xa4"), createAddress("0x4"), createAddress("0x42"), createAddress("0x423")],
  ];
  const TEST_BLOCKS = [11, 22, 33, 44];

  const mockProvider: MockEthersProvider = new MockEthersProvider();

  function createCall(comptroller: string, markets: string[], blockNumber: number | string) {
    return mockProvider.addCallTo(comptroller, blockNumber, COMPTROLLER_IFACE, "getAllMarkets", {
      inputs: [],
      outputs: [markets],
    });
  }

  beforeEach(() => mockProvider.clear());

  it("should fetch the markets correctly", async () => {
    for (let i = 0; i < TEST_CASES.length; i++) {
      const fetcher: MarketsFetcher = new MarketsFetcher(mockProvider as any, TEST_CASES[i][0]);
      createCall(TEST_CASES[i][0], TEST_CASES[i].slice(1), TEST_BLOCKS[i]);

      await fetcher.getMarkets(TEST_BLOCKS[i]);

      expect(fetcher.markets).toStrictEqual(TEST_CASES[i].slice(1));
    }
  });

  it("should update the markets list", async () => {
    for (let i = 0; i < TEST_CASES.length; i++) {
      const fetcher: MarketsFetcher = new MarketsFetcher(mockProvider as any, TEST_CASES[i][0]);
      createCall(TEST_CASES[i][0], TEST_CASES[i].slice(1), TEST_BLOCKS[i]);
      await fetcher.getMarkets(TEST_BLOCKS[i]);

      const newMarket: string = createAddress("0xffe");
      fetcher.updateMarkets(newMarket);

      const expectedArray = [...TEST_CASES[i].slice(1), newMarket];
      expect(fetcher.markets).toStrictEqual(expectedArray);
    }
  });
});
