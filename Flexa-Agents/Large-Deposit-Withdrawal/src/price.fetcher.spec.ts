import { createAddress, MockEthersProvider } from "forta-agent-tools";
import { BigNumber } from "ethers";
import { PRICE_ABI } from "./utils";
import PriceFetcher from "./price.fetcher";
import { Interface } from "@ethersproject/abi";

// contract, block, price
const TEST_DATA: [string, number | string, number][] = [
  [createAddress("0xfee5"), 20, 42],
  [createAddress("0xdef1"), 30, 1],
  [createAddress("0xc0de"), 40, 420],
  [createAddress("0xf1a7"), 50, 20000],
];

describe("PriceFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const fetcher: PriceFetcher = new PriceFetcher(mockProvider as any);

  const initialize = () => {
    for (let [contract, block, price] of TEST_DATA) {
      mockProvider.addCallTo(
        contract,
        block,
        new Interface(PRICE_ABI),
        "latestRoundData",
        {
          inputs: [],
          outputs: [
            BigNumber.from(1),
            BigNumber.from(price), // the answer
            BigNumber.from(2),
            BigNumber.from(5),
            BigNumber.from(1),
          ],
        }
      );
    }
  };

  beforeEach(() => mockProvider.clear());

  it("should fetch the correct price values", async () => {
    initialize();
    for (let [contract, block, price] of TEST_DATA) {
      const response: BigNumber[] = await fetcher.getAmpPrice(block, contract);
      const fetchedPrice = response[1];
      expect(fetchedPrice).toStrictEqual(BigNumber.from(price));
    }
  });

  it("should use the cached values", async () => {
    initialize();
    for (let [contract, block, price] of TEST_DATA) {
      const response: BigNumber[] = await fetcher.getAmpPrice(block, contract);
      const fetchedPrice = response[1];
      expect(fetchedPrice).toStrictEqual(BigNumber.from(price));
    }
    // we clear the mock to use cache values.
    mockProvider.clear();

    for (let [contract, block, price] of TEST_DATA) {
      const response: BigNumber[] = await fetcher.getAmpPrice(block, contract);
      const fetchedPrice = response[1];
      expect(fetchedPrice).toStrictEqual(BigNumber.from(price));
    }
  });
});
