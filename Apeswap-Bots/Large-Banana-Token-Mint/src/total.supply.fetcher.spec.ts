import TotalBalanceFetcher from "./total.supply.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { IBANANA } from "./constants";
import { BigNumber } from "ethers";

describe("DataFetcher tests suite", () => {
  const TEST_CASE: [number, BigNumber][] = [
    [2, BigNumber.from("6000000000000000000000")],
    [3, BigNumber.from("20000000000000000000")],
    [4, BigNumber.from("40000000000000000")],
  ];

  const mockProvider: MockEthersProvider = new MockEthersProvider();

  const mockNetworkManager = {
    bananaAddress: createAddress("0x1aa"),
  };

  function createMockTotalSupplyCall(blockNumber: number, totalSupplyCall: BigNumber) {
    return mockProvider.addCallTo(mockNetworkManager.bananaAddress, blockNumber, IBANANA, "totalSupply", {
      inputs: [],
      outputs: [totalSupplyCall],
    });
  }

  beforeEach(() => mockProvider.clear());

  it("should return the correct total supply", async () => {
    for (let [blockNumber, totalSupplyCall] of TEST_CASE) {
      const fetcher: TotalBalanceFetcher = new TotalBalanceFetcher(mockProvider as any, mockNetworkManager as any);
      createMockTotalSupplyCall(blockNumber, totalSupplyCall);

      const fetchedbBalanceCall: BigNumber = await fetcher.getTotalSupply(blockNumber);
      expect(fetchedbBalanceCall).toStrictEqual(totalSupplyCall);
    }
  });
});
