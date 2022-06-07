import Fetcher from "./price.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { LATEST_ANSWER_IFACE, ASSET_PRICE_IFACE } from "./constants";
import { BigNumber } from "ethers";
import { ethersBnToBn } from "./utils";

// format: [umeeOracleAddress, assetAddress, blockNumber, price]
const ASSET_PRICE_TEST_CASE: [string, string, number, BigNumber][] = [
  [createAddress("0x1a"), createAddress("0x2a"), 5, BigNumber.from("1000000000000000000")],
  [createAddress("0x1b"), createAddress("0x2b"), 6, BigNumber.from("500000000000000000")],
  [createAddress("0x1c"), createAddress("0x2c"), 7, BigNumber.from("5000000000000000005")],
];

// format: [ethUsdFeedAddress, blockNumber, price]
const ETH_PRICE_TEST_CASE: [string, number, BigNumber][] = [
  [createAddress("0x3a"), 4, BigNumber.from("2000000000000000000")],
  [createAddress("0x3b"), 5, BigNumber.from("600000000000000000")],
  [createAddress("0x3c"), 6, BigNumber.from("6000000000000000006")],
];

describe("Fetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();

  function createMockAssetPriceCall(
    umeeOracleAddress: string,
    assetAddress: string,
    blockNumber: number,
    price: BigNumber
  ) {
    return mockProvider.addCallTo(umeeOracleAddress, blockNumber, ASSET_PRICE_IFACE, "getAssetPrice", {
      inputs: [assetAddress],
      outputs: [price],
    });
  }

  function createMockEthPriceCall(ethUsdFeedAddress: string, blockNumber: number, price: BigNumber) {
    return mockProvider.addCallTo(ethUsdFeedAddress, blockNumber, LATEST_ANSWER_IFACE, "latestAnswer", {
      inputs: [],
      outputs: [price],
    });
  }

  beforeEach(() => mockProvider.clear());

  it("should fetch ETH price in USD correctly", async () => {
    for (let [ethUsdFeedAddress, blockNumber, price] of ETH_PRICE_TEST_CASE) {
      const fetcher: Fetcher = new Fetcher(mockProvider as any);

      createMockEthPriceCall(ethUsdFeedAddress, blockNumber, price);

      const fetchedPrice = await fetcher.getEthPrice(blockNumber, ethUsdFeedAddress);

      expect(fetchedPrice).toStrictEqual(ethersBnToBn(price, 8));
    }
  });

  it("should fetch asset price correctly", async () => {
    for (let [umeeOracleAddress, assetAddress, blockNumber, price] of ASSET_PRICE_TEST_CASE) {
      const fetcher: Fetcher = new Fetcher(mockProvider as any);

      createMockAssetPriceCall(umeeOracleAddress, assetAddress, blockNumber, price);

      const fetchedPrice = await fetcher.getAssetPrice(umeeOracleAddress, assetAddress, blockNumber);

      expect(fetchedPrice).toStrictEqual(ethersBnToBn(price, 18));
    }
  });
});
