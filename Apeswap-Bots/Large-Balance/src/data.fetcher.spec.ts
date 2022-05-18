import DataFetcher from "./data.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { APESWAP_INTERFACE } from "./utils";
import { BigNumber } from "ethers";

describe("DataFetcher tests suite", () => {
  const TEST_CASE: [string, number, BigNumber][] = [
    [createAddress("0x2a"), 2, BigNumber.from("6000000000000000000000")],
    [createAddress("0x2b"), 3, BigNumber.from("20000000000000000000")],
    [createAddress("0x2c"), 4, BigNumber.from("40000000000000000")],
  ];

  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager = {
    gnana: createAddress("0x01"),
  };

  function createMockBalanceCall(account: string, blockNumber: number, balanceCall: BigNumber) {
    return mockProvider.addCallTo(mockNetworkManager.gnana, blockNumber, APESWAP_INTERFACE, "balanceOf", {
      inputs: [account],
      outputs: [balanceCall],
    });
  }

  beforeEach(() => mockProvider.clear());

  it("should return the correct balance", async () => {
    for (let [account, blockNumber, balanceCall] of TEST_CASE) {
      const fetcher: DataFetcher = new DataFetcher(mockProvider as any, mockNetworkManager as any);

      createMockBalanceCall(account, blockNumber, balanceCall);

      const fetchedbBalanceCall: BigNumber = await fetcher.getBalance(account, blockNumber);

      expect(fetchedbBalanceCall).toStrictEqual(balanceCall);
    }
  });
});
