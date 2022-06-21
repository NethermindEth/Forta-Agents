import Fetcher from "./fetcher";
import { BigNumber } from "ethers";
import { Interface } from "@ethersproject/abi";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { COMPTROLLER_IFACE, QI_TOKENS_ABI } from "./utils";

//QiToken address, block number, borrow rate
const TEST_BORROW_CASES: [string, number, BigNumber][] = [
  [createAddress("0xabcd"), 21, BigNumber.from(1000000)],
  [createAddress("0x123a"), 22, BigNumber.from(12)],
  [createAddress("0x4343"), 23, BigNumber.from(9234423446364)],
  [createAddress("0x171b"), 24, BigNumber.from(0)],
];

//QiToken address, block number, supply rate
const TEST_SUPPLY_CASES: [string, number, BigNumber][] = [
  [createAddress("0x9999"), 41, BigNumber.from(20000000)],
  [createAddress("0xcccc"), 42, BigNumber.from(32)],
  [createAddress("0xabba"), 43, BigNumber.from(846845684546)],
  [createAddress("0xcacb"), 44, BigNumber.from(0)],
];

// foramat: [comptroller, block, markets]
const TEST_MARKETS_DATA: [string, number, string, string, string][] = [
  [createAddress("0xa1"), 11, createAddress("0x1"), createAddress("0x12"), createAddress("0x123")],
  [createAddress("0xa2"), 22, createAddress("0x2"), createAddress("0x22"), createAddress("0x223")],
  [createAddress("0xa3"), 33, createAddress("0x3"), createAddress("0x32"), createAddress("0x323")],
  [createAddress("0xa4"), 44, createAddress("0x4"), createAddress("0x42"), createAddress("0x423")],
];

describe("Fetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let testFetcher: Fetcher;
  const TEST_QI_IFACE: Interface = new Interface(QI_TOKENS_ABI);

  function createCall(comptroller: string, markets: string[], blockNumber: number | string) {
    return mockProvider.addCallTo(comptroller, blockNumber, COMPTROLLER_IFACE, "getAllMarkets", {
      inputs: [],
      outputs: [markets],
    });
  }

  beforeEach(() => {
    testFetcher = new Fetcher(mockProvider as any, TEST_MARKETS_DATA[0][0]);
    mockProvider.clear();
  });

  it("should fetch the markets correctly", async () => {
    for (let i = 0; i < TEST_MARKETS_DATA.length; i++) {
      const fetcher: Fetcher = new Fetcher(mockProvider as any, TEST_MARKETS_DATA[i][0]);
      createCall(TEST_MARKETS_DATA[i][0], TEST_MARKETS_DATA[i].slice(2) as string[], TEST_MARKETS_DATA[i][1]);

      await fetcher.getMarkets(TEST_MARKETS_DATA[i][1]);

      expect(fetcher.markets).toStrictEqual(TEST_MARKETS_DATA[i].slice(2));
    }
  });

  it("should update the markets list", async () => {
    for (let i = 0; i < TEST_MARKETS_DATA.length; i++) {
      const fetcher: Fetcher = new Fetcher(mockProvider as any, TEST_MARKETS_DATA[i][0]);
      createCall(TEST_MARKETS_DATA[i][0], TEST_MARKETS_DATA[i].slice(2) as string[], TEST_MARKETS_DATA[i][1]);
      await fetcher.getMarkets(TEST_MARKETS_DATA[i][1]);

      const newMarket: string = createAddress("0xffe");
      fetcher.updateMarkets(newMarket);

      const expectedArray = [...TEST_MARKETS_DATA[i].slice(2), newMarket];
      expect(fetcher.markets).toStrictEqual(expectedArray);

      // should remove the excluded market and ignore the non-existant one.
      fetcher.excludeMarkets([newMarket, createAddress("0xfede")]);
      expect(fetcher.markets).toStrictEqual([...TEST_MARKETS_DATA[i].slice(2)]);
    }
  });

  it("should return the called qiToken's current borrow interest rate", async () => {
    for (let [qiToken, block, borrowRate] of TEST_BORROW_CASES) {
      mockProvider.addCallTo(qiToken, block, TEST_QI_IFACE, "borrowRatePerTimestamp", {
        inputs: [],
        outputs: [borrowRate],
      });
      const rate: BigNumber = await testFetcher.getBorrowInterestRates(block, qiToken);
      expect(rate).toStrictEqual(borrowRate);
      //Use cached values
      mockProvider.clear();
      expect(rate).toStrictEqual(borrowRate);
    }
  });

  it("should return the called qiToken's current supply interest rate", async () => {
    for (let [qiToken, block, supplyRate] of TEST_SUPPLY_CASES) {
      mockProvider.addCallTo(qiToken, block, TEST_QI_IFACE, "borrowRatePerTimestamp", {
        inputs: [],
        outputs: [supplyRate],
      });
      const rate: BigNumber = await testFetcher.getBorrowInterestRates(block, qiToken);
      expect(rate).toStrictEqual(supplyRate);
      //Use cached values
      mockProvider.clear();
      expect(rate).toStrictEqual(supplyRate);
    }
  });
});
