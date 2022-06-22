import { Network } from "forta-agent";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import BalanceFetcher from "./balance.fetcher";
import { TOKEN_ABI } from "./constants";
import { Interface } from "ethers/lib/utils";
import { NetworkManager } from "forta-agent-tools";
import { AgentConfig, NetworkData } from "./utils";

// [blockNumber, balance]
const TEST_BALANCES: [number, BigNumber][] = [
  [10, BigNumber.from(70)],
  [20, BigNumber.from(100)],
  [30, BigNumber.from(100)],
  [40, BigNumber.from(120)],
  [50, BigNumber.from(240)],
];

// [AssetType, tokenAddress]
const TEST_DATA: string[] = [createAddress("0xa2"), createAddress("0xa3"), createAddress("0xa4")];

const VAULT_ADDRESS = createAddress("0xa1");
const tokenAddress = createAddress("0xa2");
const BALANCE_IFACE = new Interface(TOKEN_ABI);

describe("BalanceFetcher tests suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let fetcher: BalanceFetcher;

  beforeAll(() => {
    fetcher = new BalanceFetcher(mockProvider as any);
  });

  it("should set token address correctly", async () => {
    for (let tokenAddress of TEST_DATA) {
      // set fetcher data
      fetcher.setData(tokenAddress);
      expect(fetcher.tokenAddress).toStrictEqual(tokenAddress);
    }
    expect(mockProvider.call).toBeCalledTimes(0);
  });

  it("should fetch balance and use cache correctly", async () => {
    fetcher.setData(tokenAddress);

    for (let [block, balance] of TEST_BALANCES) {
      mockProvider.addCallTo(tokenAddress, block, BALANCE_IFACE, "balanceOf", {
        inputs: [VAULT_ADDRESS],
        outputs: [balance],
      });
      const fetchedBalance = await fetcher.getBalance(block, VAULT_ADDRESS);
      expect(fetchedBalance).toStrictEqual(balance);
    }
    expect(mockProvider.call).toBeCalledTimes(5);

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [block, balance] of TEST_BALANCES) {
      const fetchedBalance = await fetcher.getBalance(block, VAULT_ADDRESS);
      expect(fetchedBalance).toStrictEqual(balance);
    }
    expect(mockProvider.call).toBeCalledTimes(5);
  });
});
