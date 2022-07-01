import SaleFetcher from "./sales.fetcher";
import { createAddress, MockEthersProvider as MockProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { SALE_IFACE } from "./utils";

const TEST_DATA: [string, number, number][] = [
  [createAddress("0xfee5"), 20, 42],
  [createAddress("0xdef1"), 30, 1],
  [createAddress("0xc0de"), 12, 420],
  [createAddress("0xf1a7"), 90, 20000],
  [createAddress("0xca11"), 11, 15],
];

describe("SaleFetcher test suite", () => {
  const mockProvider: MockProvider = new MockProvider();
  const fetcher: SaleFetcher = new SaleFetcher(mockProvider as any);

  beforeEach(() => {
    mockProvider.clear();
    for (let [contract, block, total] of TEST_DATA) {
      mockProvider.addCallTo(contract, block, SALE_IFACE, "totalPaymentReceived", {
        inputs: [],
        outputs: [BigNumber.from(total)],
      });
    }
  });

  it("should fetch the correct values", async () => {
    for (let [contract, block, supply] of TEST_DATA) {
      const total: BigNumber = await fetcher.getTotalPaymentReceived(block, contract);
      expect(total).toStrictEqual(BigNumber.from(supply));
    }

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [contract, block, supply] of TEST_DATA) {
      const total: BigNumber = await fetcher.getTotalPaymentReceived(block, contract);
      expect(total).toStrictEqual(BigNumber.from(supply));
    }
  });
});
