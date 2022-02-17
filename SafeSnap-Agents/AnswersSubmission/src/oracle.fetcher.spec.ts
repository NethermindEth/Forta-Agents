import { MockEthersProvider } from "forta-agent-tools";
import OracleFetcher from "./oracle.fetcher";
import { createAddress } from "forta-agent-tools";
import { REALITY_ABI } from "./utils";

const TEST_DATA: [string, number, string][] = [
  [createAddress("0xeea2"), 20, createAddress("0xfee5")],
  [createAddress("0xbaa1"), 30, createAddress("0xabe2")],
  [createAddress("0xcde4"), 12, createAddress("0xdea5")],
  [createAddress("0xdead"), 90, createAddress("0xeea4")],
  [createAddress("0xfea2"), 11, createAddress("0xaabb")],
];

describe("OracleFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const fetcher: OracleFetcher = new OracleFetcher(mockProvider as any);

  const initialize = () => {
    for (let [contract, block, oracle] of TEST_DATA) {
      mockProvider.addCallTo(contract, block, REALITY_ABI, "oracle", {
        inputs: [],
        outputs: [oracle],
      });
    }
  };

  beforeEach(() => mockProvider.clear());

  it("should fetch the correct value", async () => {
    initialize();

    for (let [contract, block, oracle] of TEST_DATA) {
      const fetched_oracle: string = await fetcher.getOracle(block, contract);
      expect(fetched_oracle.toLowerCase()).toStrictEqual(oracle);
    }
  });
});
