import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import BalanceFetcher from "./balance.fetcher";
import { TOKEN_ABI } from "./constants";
import { Interface } from "ethers/lib/utils";

// [blockNumber, balance]
const TEST_BALANCES: [number, BigNumber][] = [
  [10, BigNumber.from(70)],
  [20, BigNumber.from(100)],
  [30, BigNumber.from(100)],
  [40, BigNumber.from(120)],
  [50, BigNumber.from(240)],
];

// [blockNumber, symbol]
const TEST_SYMBOLS: [number, string][] = [
  [10, "AAA"],
  [20, "BBB"],
  [30, "CCC"],
  [40, "DDD"],
  [50, "EEE"],
];

const VAULT_ADDRESS = createAddress("0xa1");
const tokenAddress = createAddress("0xa2");
const BALANCE_IFACE = new Interface(TOKEN_ABI);

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
        inputs: [VAULT_ADDRESS],
        outputs: [balance],
      });
      const fetchedBalance = await fetcher.getBalance(block, VAULT_ADDRESS, tokenAddress);
      expect(fetchedBalance).toStrictEqual(balance);
    }
    expect(mockProvider.call).toBeCalledTimes(5);

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [block, balance] of TEST_BALANCES) {
      const fetchedBalance = await fetcher.getBalance(block, VAULT_ADDRESS, tokenAddress);
      expect(fetchedBalance).toStrictEqual(balance);
    }
    expect(mockProvider.call).toBeCalledTimes(5);
    mockProvider.clear();
  });

  it("should fetch token symbol and use cache correctly", async () => {
    for (let [block, symbol] of TEST_SYMBOLS) {
      mockProvider.addCallTo(tokenAddress, block, BALANCE_IFACE, "symbol", {
        inputs: [],
        outputs: [symbol],
      });
      const fetchedBalance = await fetcher.getSymbol(block, tokenAddress);
      expect(fetchedBalance).toStrictEqual(symbol);
    }
    expect(mockProvider.call).toBeCalledTimes(5);

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [block, symbol] of TEST_SYMBOLS) {
      const fetchedBalance = await fetcher.getSymbol(block, tokenAddress);
      expect(fetchedBalance).toStrictEqual(symbol);
    }
    expect(mockProvider.call).toBeCalledTimes(5);
  });
});
