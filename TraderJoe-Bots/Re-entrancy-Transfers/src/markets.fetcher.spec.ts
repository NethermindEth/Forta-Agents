import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import MarketsFetcher from "./markets.fetcher";
import { MARKETS_IFACE } from "./utils";

//Data used for tests [blockNumber, markets]
const TEST_DATA: [number, string[]][] = [
  [10, [createAddress("0x31"), createAddress("0x32"), createAddress("0x33")]],
  [20, [createAddress("0x41"), createAddress("0x42"), createAddress("0x43")]],
  [30, [createAddress("0x51"), createAddress("0x52"), createAddress("0x53")]],
];
const TEST_ADDRESSES = [createAddress("0xa1"), createAddress("0xa2"), createAddress("0xa3"), createAddress("0xa4")];

describe("BalanceFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const fetcher: MarketsFetcher = new MarketsFetcher(mockProvider as any);

  beforeAll(() => {
    for (let [block, markets] of TEST_DATA) {
      mockProvider.addCallTo(TEST_ADDRESSES[0], block, MARKETS_IFACE, "getAllMarkets", {
        inputs: [],
        outputs: [markets],
      });
    }
  });

  it("should store contract address correctly", async () => {
    for (let address of TEST_ADDRESSES) {
      fetcher.setJoeTrollerContract(address);
      expect(fetcher.joeTrollerAddress).toStrictEqual(address);
    }
  });

  it("should fetch markets list correctly", async () => {
    fetcher.setJoeTrollerContract(TEST_ADDRESSES[0]);

    for (let [block, markets] of TEST_DATA) {
      await fetcher.getMarkets(block);
      expect(fetcher.markets).toStrictEqual(new Set(markets));
    }
  });

  it("should update markets list correctly", async () => {
    fetcher.setJoeTrollerContract(TEST_ADDRESSES[0]);
    await fetcher.getMarkets(TEST_DATA[0][0]);

    fetcher.updateMarkets("MarketListed", createAddress("0xde1"));
    expect(fetcher.markets).toStrictEqual(new Set([TEST_DATA[0][1], createAddress("0xde1")].flat()));

    fetcher.updateMarkets("MarketDelisted", createAddress("0xde1"));
    expect(fetcher.markets).toStrictEqual(new Set(TEST_DATA[0][1]));
  });
});
