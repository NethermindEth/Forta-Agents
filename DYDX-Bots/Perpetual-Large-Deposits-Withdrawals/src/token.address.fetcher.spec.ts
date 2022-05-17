/*
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import TokenAddressFetcher from "./token.address.fetcher";

// [blockNumber, assetType]
const TEST_ASSETS: [number, BigNumber][] = [
  [10, BigNumber.from(70)],
  [20, BigNumber.from(100)],
  [30, BigNumber.from(100)],
  [40, BigNumber.from(120)],
];

// [block, assetType, tokenAddress]
const TEST_ADDRESSES: [number, BigNumber, string][] = [
  [10, BigNumber.from(80), createAddress("0xa2")],
  [20, BigNumber.from(90), createAddress("0xa3")],
  [30, BigNumber.from(200), createAddress("0xa4")],
  [40, BigNumber.from(70), createAddress("0xa5")],
];

const perpetualProxy = createAddress("0xa1");

describe("TokenAddressFetcher tests suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let fetcher: TokenAddressFetcher;

  const generateStorageAtCall = (block: number, assetType: BigNumber, tokenAddress: string) => {

  };

  beforeAll(() => {
    const mockNetworkManager = {
      perpetualProxy: perpetualProxy,
    };

    fetcher = new TokenAddressFetcher(mockProvider as any, mockNetworkManager as any);
  });

  it("should get system assetType correctly", async () => {
    for (let [block, systemAssetType] of TEST_ASSETS) {
      mockProvider.addCallTo(perpetualProxy, block, new Interface(ERC20_TOKEN_ABI), "balanceOf", {
        inputs: [perpetualProxy],
        outputs: [systemAssetType],
      });
      const fetchedValue = await fetcher.getSystemAssetType(block);
      expect(fetchedValue).toStrictEqual(systemAssetType);
    }
  });

  it("should fetch token address and use cache correctly", async () => {
    for (let [block, assetType, tokenAddress] of TEST_ADDRESSES) {
      mockProvider.addStorage(perpetualProxy, 20, block, tokenAddress);

      const fetchedAddress = await fetcher.extractTokenAddress(assetType, block);
      expect(fetchedAddress).toStrictEqual(tokenAddress);
    }

    // clear mockProvider to use cache
    mockProvider.clear();
    for (let [block, assetType, tokenAddress] of TEST_ADDRESSES) {
      const fetchedAddress = await fetcher.extractTokenAddress(assetType, block);
      expect(fetchedAddress).toStrictEqual(tokenAddress);
    }
  });
});

*/
