import DataFetcher from "./data.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { benqiInterface } from "./utils";
import { BigNumber } from "ethers";

describe("DataFetcher tests suite", () => {
  // format: [benqiAddress, account, balanceCall]
  const TEST_CASE: [string, string, BigNumber][] = [
    [createAddress("0x1a"), createAddress("0x2a"), BigNumber.from("6000000000000000000000")],
    [createAddress("0x1b"), createAddress("0x2b"), BigNumber.from("20000000000000000000")],
    [createAddress("0x1c"), createAddress("0x2c"), BigNumber.from("40000000000000000")],
  ];

  const mockProvider: MockEthersProvider = new MockEthersProvider();

  function createMockBalanceCall(account: string, benqiAddress: string, balanceCall: BigNumber) {
    return mockProvider.addCallTo(benqiAddress, "latest", benqiInterface, "balanceOf", {
      inputs: [account],
      outputs: [balanceCall],
    });
  }

  beforeEach(() => mockProvider.clear());

  it("should return the correct balance", async () => {
    for (let [benqiAddress, account, balanceCall] of TEST_CASE) {
      const fetcher: DataFetcher = new DataFetcher(benqiAddress, mockProvider as any);

      createMockBalanceCall(account, benqiAddress, balanceCall);

      const fetchedbBalanceCall: BigNumber = await fetcher.getBalance(account);

      expect(fetchedbBalanceCall).toStrictEqual(balanceCall);
    }
  });
});
