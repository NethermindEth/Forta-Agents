import { MockEthersProvider } from "forta-agent-tools/lib/test";
import { createAddress } from "forta-agent-tools";
import { BigNumber } from "ethers";
import BalanceFetcher from "./balance.fetcher";
import { ERC20_ABI } from "./utils";
import { Interface } from "ethers/lib/utils";

// [blockNumber, balance]
const TEST_BALANCES: [number, BigNumber][] = [
  [10, BigNumber.from(70)],
  [20, BigNumber.from(100)],
  [30, BigNumber.from(100)],
  [40, BigNumber.from(120)],
  [50, BigNumber.from(240)],
];

const MONITORED_ADDRESS = createAddress("0xa1");
const tokenAddress = createAddress("0xa2");
const BALANCE_IFACE = new Interface(ERC20_ABI);

describe("BalanceFetcher tests suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let fetcher: BalanceFetcher;

  beforeAll(() => {
    fetcher = new BalanceFetcher(mockProvider as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch balance and use cache correctly", async () => {
    for (let [block, balance] of TEST_BALANCES) {
      mockProvider.addCallTo(tokenAddress, block, BALANCE_IFACE, "balanceOf", {
        inputs: [MONITORED_ADDRESS],
        outputs: [balance],
      });
      const fetchedBalance = await fetcher.getBalance(block, MONITORED_ADDRESS, tokenAddress);
      expect(fetchedBalance).toStrictEqual(balance);
    }
    expect(mockProvider.call).toBeCalledTimes(5);

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [block, balance] of TEST_BALANCES) {
      const fetchedBalance = await fetcher.getBalance(block, MONITORED_ADDRESS, tokenAddress);
      expect(fetchedBalance).toStrictEqual(balance);
    }
    expect(mockProvider.call).toBeCalledTimes(5);
    mockProvider.clear();
  });
});
