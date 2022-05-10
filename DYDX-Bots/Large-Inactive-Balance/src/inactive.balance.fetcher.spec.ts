import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { INACTIVE_BALANCE_ABI } from "./utils";
import InactiveBalanceFetcher from "./inactive.balance.fetcher";

//Data used for tests [blockNumber, staker,  balance]
const TEST_DATA: [number, string, BigNumber][] = [
  [10, createAddress("0xae1"), BigNumber.from(70)],
  [20, createAddress("0xbe2"), BigNumber.from(100)],
  [30, createAddress("0xae2"), BigNumber.from(100)],
  [40, createAddress("0xce3"), BigNumber.from(120)],
  [50, createAddress("0xde4"), BigNumber.from(240)],
];

const safetyContract = createAddress("0xa1");

describe("InactiveBalanceFetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockNetworkManager = {
    safetyModule: safetyContract,
  };

  const fetcher: InactiveBalanceFetcher = new InactiveBalanceFetcher(
    mockProvider as any,
    mockNetworkManager as any
  );

  beforeAll(() => {
    for (let [block, staker, inactiveBalance] of TEST_DATA) {
      mockProvider.addCallTo(
        safetyContract,
        block,
        INACTIVE_BALANCE_ABI,
        "getInactiveBalanceNextEpoch",
        {
          inputs: [staker],
          outputs: [inactiveBalance],
        }
      );
    }
  });

  it("should fetch balance and use cache correctly", async () => {
    for (let [block, staker, balance] of TEST_DATA) {
      const fetchedBalance = await fetcher.getInactiveBalance(staker, block);
      expect(fetchedBalance).toStrictEqual(balance);
    }

    // clear mock to use cache
    mockProvider.clear();
    for (let [block, staker, balance] of TEST_DATA) {
      const fetchedBalance = await fetcher.getInactiveBalance(staker, block);
      expect(fetchedBalance).toStrictEqual(balance);
    }
  });
});
