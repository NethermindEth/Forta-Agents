import Fetcher from "./fetcher";
import { BigNumber } from "ethers";
import { Interface } from "@ethersproject/abi";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { QI_TOKENS_ABI } from "./utils";

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

describe("Interest rates fetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const testFetcher: Fetcher = new Fetcher(mockProvider as any);
  const TEST_QI_IFACE: Interface = new Interface(QI_TOKENS_ABI);

  beforeEach(() => {
    mockProvider.clear();
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
