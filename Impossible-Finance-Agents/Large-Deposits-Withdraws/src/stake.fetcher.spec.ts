import StakeFetcher from "./stake.fetcher";
import { createAddress, MockEthersProvider as MockProvider } from "forta-agent-tools";
import { BigNumber } from "ethers";
import { SUPPLY_IFACE } from "./utils";

const TEST_DATA: [string, number, number][] = [
  [createAddress("0xfee5"), 20, 42],
  [createAddress("0xfee5"), 30, 1],
  [createAddress("0xfee5"), 12, 420],
  [createAddress("0xfee5"), 90, 20000],
  [createAddress("0xfee5"), 11, 15],
];

describe("StakeFetcher test suite", () => {
  const mockProvider: MockProvider = new MockProvider();
  const fetcher: StakeFetcher = new StakeFetcher(mockProvider as any);

  const initialize = () => {
    for (let [contract, block, total] of TEST_DATA) {
      mockProvider.addCallTo(contract, block, SUPPLY_IFACE, "totalSupply", {
        inputs: [],
        outputs: [total],
      });
    }
  };

  beforeEach(() => mockProvider.clear());

  it("should fetch the correct values", async () => {
    initialize();

    for (let [contract, block, supply] of TEST_DATA) {
      const total: BigNumber = await fetcher.getTotalSupply(contract, block);
      expect(total).toStrictEqual(BigNumber.from(supply));
    }
  });
});
