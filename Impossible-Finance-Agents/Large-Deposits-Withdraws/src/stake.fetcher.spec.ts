import StakeFetcher from "./stake.fetcher";
import { createAddress, MockEthersProvider, MockEthersProvider as MockProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { SUPPLY_IFACE } from "./utils";

// block, supply
const TEST_DATA: [number, number][] = [
  [20, 42],
  [30, 1],
  [12, 420],
  [90, 20000],
  [11, 15],
];

const TEST_ADDRESSES = [createAddress("0xdea1"), createAddress("0xdea2"), createAddress("0xdea3")];

describe("StakeFetcher test suite", () => {
  const mockProvider = new MockEthersProvider();
  const fetcher = new StakeFetcher(mockProvider as any, TEST_ADDRESSES[0]);

  beforeEach(() => {
    mockProvider.clear();
    for (let [block, total] of TEST_DATA) {
      mockProvider.addCallTo(TEST_ADDRESSES[0], block, SUPPLY_IFACE, "totalSupply", {
        inputs: [],
        outputs: [total],
      });
    }
  });

  it("should store staking contract address", async () => {
    for (let contract of TEST_ADDRESSES) {
      const fetcher = new StakeFetcher(mockProvider as any, contract);

      expect(fetcher.tokenAddress).toStrictEqual(contract);
    }
  });

  it("should fetch the correct values", async () => {
    for (let [block, supply] of TEST_DATA) {
      const total: BigNumber = await fetcher.getTotalSupply(block);
      expect(total).toStrictEqual(BigNumber.from(supply));
    }

    // clear to use cache values
    mockProvider.clear();

    for (let [block, supply] of TEST_DATA) {
      const total: BigNumber = await fetcher.getTotalSupply(block);
      expect(total).toStrictEqual(BigNumber.from(supply));
    }
  });
});
