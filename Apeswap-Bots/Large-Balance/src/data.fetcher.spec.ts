import DataFetcher from "./data.fetcher";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { APESWAP_INTERFACE } from "./utils";
import { BigNumber } from "ethers";

describe("DataFetcher tests suite", () => {
  const TEST_CASE: [string, string, number, BigNumber][] = [
    [
      createAddress("0x1a"),
      createAddress("0x2a"),
      2,
      BigNumber.from("6000000000000000000000"),
    ],
    [
      createAddress("0x1b"),
      createAddress("0x2b"),
      3,
      BigNumber.from("20000000000000000000"),
    ],
    [
      createAddress("0x1c"),
      createAddress("0x2c"),
      4,
      BigNumber.from("40000000000000000"),
    ],
  ];

  const mockProvider: MockEthersProvider = new MockEthersProvider();

  function createMockBalanceCall(
    account: string,
    apeswapAddress: string,
    blockNumber: number,
    balanceCall: BigNumber
  ) {
    return mockProvider.addCallTo(
      apeswapAddress,
      blockNumber,
      APESWAP_INTERFACE,
      "balanceOf",
      {
        inputs: [account],
        outputs: [balanceCall],
      }
    );
  }

  beforeEach(() => mockProvider.clear());

  it("should return the correct balance", async () => {
    for (let [apeswapAddress, account, blockNumber, balanceCall] of TEST_CASE) {
      const fetcher: DataFetcher = new DataFetcher(
        apeswapAddress,
        mockProvider as any
      );

      createMockBalanceCall(account, apeswapAddress, blockNumber, balanceCall);

      const fetchedbBalanceCall: BigNumber = await fetcher.getBalance(
        account,
        blockNumber
      );

      expect(fetchedbBalanceCall).toStrictEqual(balanceCall);
    }
  });
});
