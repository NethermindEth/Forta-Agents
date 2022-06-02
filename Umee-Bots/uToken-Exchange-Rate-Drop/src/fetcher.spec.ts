import Fetcher from "./fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { UTOKENS_IFACE, UMEE_ORACLE_PRICE_IFACE, LENDING_POOL_IFACE, AgentConfig } from "./utils";
import { BigNumber } from "ethers";

// format: [uTokenAddress, blockNumber, underlyingAssetAddress]
const UNDERLYING_ASSET_TEST_CASE: [string, number, string][] = [
  [createAddress("0x2a"), 2, createAddress("0x1")],
  [createAddress("0x2b"), 3, createAddress("0x2")],
  [createAddress("0x2c"), 4, createAddress("0x3")],
];

// format: [assetAddress, blockNumber, price]
const PRICE_TEST_CASE: [string, number, BigNumber][] = [
  [createAddress("0x3a"), 5, BigNumber.from("1000000000000000000")],
  [createAddress("0x3b"), 6, BigNumber.from("500000000000000000")],
  [createAddress("0x3c"), 7, BigNumber.from("5000000000000000005")],
];

// format: [assetAddress, blockNumber, normalizedIncome]
const NORMALIZED_INCOME_TEST_CASE: [string, number, BigNumber][] = [
  [createAddress("0x4a"), 8, BigNumber.from("2000000000000000000")],
  [createAddress("0x4b"), 9, BigNumber.from("600000000000000000")],
  [createAddress("0x4c"), 10, BigNumber.from("6000000000000000006")],
];

const TEST_CONFIG: AgentConfig = {
  uTokens: [],
  uTokenPairs: [],
  umeeOracle: createAddress("0x1"),
  lendingPool: createAddress("0x2"),
  decimals: 4,
};

describe("Fetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();

  function createMockUnderlyingAssetCall(uTokenAddress: string, blockNumber: number, underlyingAsset: string) {
    return mockProvider.addCallTo(uTokenAddress, blockNumber, UTOKENS_IFACE, "UNDERLYING_ASSET_ADDRESS", {
      inputs: [],
      outputs: [underlyingAsset],
    });
  }

  function createMockPriceCall(assetAddress: string, blockNumber: number, price: BigNumber) {
    return mockProvider.addCallTo(TEST_CONFIG.umeeOracle, blockNumber, UMEE_ORACLE_PRICE_IFACE, "getAssetPrice", {
      inputs: [assetAddress],
      outputs: [price],
    });
  }

  function createMockNormalizedIncomeCall(assetAddress: string, blockNumber: number, price: BigNumber) {
    return mockProvider.addCallTo(
      TEST_CONFIG.lendingPool,
      blockNumber,
      LENDING_POOL_IFACE,
      "getReserveNormalizedIncome",
      {
        inputs: [assetAddress],
        outputs: [price],
      }
    );
  }

  beforeEach(() => mockProvider.clear());

  it("should fetch the underlying asset correctly", async () => {
    for (let [uTokenAddress, blockNumber, underlyingAsset] of UNDERLYING_ASSET_TEST_CASE) {
      const fetcher: Fetcher = new Fetcher(mockProvider as any, TEST_CONFIG);

      createMockUnderlyingAssetCall(uTokenAddress, blockNumber, underlyingAsset);

      const fetchedUnderlyingAsset = await fetcher.getUnderlyingAssetAddress(uTokenAddress, blockNumber);

      expect(fetchedUnderlyingAsset).toStrictEqual(underlyingAsset);
    }
  });

  it("should fetch the price correctly", async () => {
    for (let [assetAddress, blockNumber, price] of PRICE_TEST_CASE) {
      const fetcher: Fetcher = new Fetcher(mockProvider as any, TEST_CONFIG);

      createMockPriceCall(assetAddress, blockNumber, price);

      const fetchedPrice = await fetcher.getPrice(assetAddress, blockNumber);

      expect(fetchedPrice).toStrictEqual(price);
    }
  });

  it("should fetch reserve normalized income correctly", async () => {
    for (let [assetAddress, blockNumber, normalizedIncome] of NORMALIZED_INCOME_TEST_CASE) {
      const fetcher: Fetcher = new Fetcher(mockProvider as any, TEST_CONFIG);

      createMockNormalizedIncomeCall(assetAddress, blockNumber, normalizedIncome);

      const fetchedNormalizedIncome = await fetcher.getReserveNormalizedIncome(assetAddress, blockNumber);

      expect(fetchedNormalizedIncome).toStrictEqual(normalizedIncome);
    }
  });
});
