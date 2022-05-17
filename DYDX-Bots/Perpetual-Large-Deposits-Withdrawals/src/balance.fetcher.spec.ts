import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import BalanceFetcher from "./balance.fetcher";
import { ERC20_TOKEN_ABI } from "./utils";
import { Interface } from "ethers/lib/utils";

// [blockNumber, balance]
const TEST_BALANCES: [number, BigNumber][] = [
  [10, BigNumber.from(70)],
  [20, BigNumber.from(100)],
  [30, BigNumber.from(100)],
  [40, BigNumber.from(120)],
  [50, BigNumber.from(240)],
];

// [AssetType, tokenAddress]
const TEST_DATA: [BigNumber, string][] = [
  [BigNumber.from(0xfed), createAddress("0xa2")],
  [BigNumber.from(0xeed), createAddress("0xa3")],
  [BigNumber.from(0xced), createAddress("0xa4")],
];

const perpetualProxy = createAddress("0xa1");
const assetType: BigNumber = BigNumber.from(0xfede);
const tokenAddress = createAddress("0xa2");

describe("BalanceFetcher tests suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let fetcher: BalanceFetcher;

  beforeAll(() => {
    const mockNetworkManager = {
      perpetualProxy: perpetualProxy,
    };

    fetcher = new BalanceFetcher(mockProvider as any, mockNetworkManager as any);
  });

  it("should set data correctly", async () => {
    for (let [assetType, tokenAddress] of TEST_DATA) {
      // set fetcher data
      fetcher.setData(assetType, tokenAddress);
      expect(fetcher.assetType).toStrictEqual(assetType);
      expect(fetcher.tokenAddress).toStrictEqual(tokenAddress);
    }
  });

  it("should fetch balance and use cache correctly", async () => {
    fetcher.setData(assetType, tokenAddress);

    for (let [block, balance] of TEST_BALANCES) {
      mockProvider.addCallTo(tokenAddress, block, new Interface(ERC20_TOKEN_ABI), "balanceOf", {
        inputs: [perpetualProxy],
        outputs: [balance],
      });
      const fetchedBalance = await fetcher.getBalance(block);
      expect(fetchedBalance).toStrictEqual(balance);
    }

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [block, balance] of TEST_BALANCES) {
      const fetchedBalance = await fetcher.getBalance(block);
      expect(fetchedBalance).toStrictEqual(balance);
    }
  });
});
