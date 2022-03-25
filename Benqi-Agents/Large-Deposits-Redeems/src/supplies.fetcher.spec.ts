import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { SUPPLIES_SIGNATURE } from "./utils";
import SuppliesFetcher from "./supplies.fetcher";
import { Interface } from "ethers/lib/utils";

//Data used for tests [blockNumber, totalSupplies]
const TEST_DATA: [number, BigNumber][] = [
  [10, BigNumber.from(70)],
  [20, BigNumber.from(100)],
  [30, BigNumber.from(100)],
  [40, BigNumber.from(120)],
  [50, BigNumber.from(240)],
];
const stakingContract = createAddress("0xa1");

describe("suppliesFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const fetcher: SuppliesFetcher = new SuppliesFetcher(mockProvider as any, stakingContract);

  const initialize = () => {
    for (let [block, supplies] of TEST_DATA) {
      mockProvider.addCallTo(stakingContract, block, new Interface(SUPPLIES_SIGNATURE), "totalSupplies", {
        inputs: [],
        outputs: [supplies],
      });
    }
  };

  beforeEach(() => mockProvider.clear());

  it("should fetch the totalSupplies and use cache correctly", async () => {
    initialize();

    for (let [block, supplies] of TEST_DATA) {
      const totalSupplies = await fetcher.getTotalSupplies(block);
      expect(totalSupplies).toStrictEqual(supplies);
    }

    // clear mock to use cache
    mockProvider.clear();
    for (let [block, supplies] of TEST_DATA) {
      const totalSupplies = await fetcher.getTotalSupplies(block);
      expect(totalSupplies).toStrictEqual(supplies);
    }
  });
});
