import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { BigNumber } from "ethers";
import TokenAddressFetcher from "./token.address.fetcher";
import { solidityKeccak256 } from "ethers/lib/utils";
import { when } from "jest-when";

// [blockNumber, assetType]
const TEST_ASSETS: [number, BigNumber][] = [
  [10, BigNumber.from(70)],
  [20, BigNumber.from(100)],
  [30, BigNumber.from(100)],
  [40, BigNumber.from(120)],
];
const padding = "0xf47261b0000000000000000000000000";

// [block, assetType, tokenAddress, assetInfo]
const TEST_ADDRESSES: [number, BigNumber, string, string][] = [
  [10, BigNumber.from(80), createAddress("0xa2"), padding.concat(createAddress("0xa2").slice(2))],
  [20, BigNumber.from(90), createAddress("0xa3"), padding.concat(createAddress("0xa3").slice(2))],
  [30, BigNumber.from(200), createAddress("0xa4"), padding.concat(createAddress("0xa4").slice(2))],
  [40, BigNumber.from(70), createAddress("0xa5"), padding.concat(createAddress("0xa5").slice(2))],
];

const perpetualProxy = createAddress("0xa1");

describe("TokenAddressFetcher tests suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  let fetcher: TokenAddressFetcher;

  beforeAll(() => {
    const mockNetworkManager = {
      perpetualProxy: perpetualProxy,
      slots: {
        systemSlot: 5,
        mappingSlot: 9,
      },
    };

    fetcher = new TokenAddressFetcher(mockProvider as any, mockNetworkManager as any);
  });

  it("should get system assetType correctly", async () => {
    for (let [block, systemAssetType] of TEST_ASSETS) {
      when(mockProvider.getStorageAt)
        .calledWith(perpetualProxy, BigNumber.from(fetcher.networkManager.slots.systemSlot).toHexString(), block)
        .mockReturnValue(systemAssetType.toHexString());

      const fetchedValue = await fetcher.getSystemAssetType(block);
      expect(fetchedValue).toStrictEqual(systemAssetType);
    }
  });

  it("should fetch assetInfo and extract token address correctly", async () => {
    for (let [block, assetType, tokenAddress, assetInfo] of TEST_ADDRESSES) {
      // data stored in each slot.
      const [firstSlotData, secondSlotData] = [assetInfo.slice(0, 68), "0x" + assetInfo.slice(68, 74)];
      // slots computation
      const sizeSlot = solidityKeccak256(
        ["uint", "uint"],
        [assetType.toHexString(), fetcher.networkManager.slots.mappingSlot]
      );

      const dataSlot = solidityKeccak256(["uint"], [sizeSlot]);

      // storing data in the slots
      when(mockProvider.getStorageAt)
        .calledWith(perpetualProxy, BigNumber.from(dataSlot).toHexString(), block)
        .mockReturnValue(firstSlotData);

      when(mockProvider.getStorageAt)
        .calledWith(perpetualProxy, BigNumber.from(dataSlot).add(1).toHexString(), block)
        .mockReturnValue(secondSlotData);

      // calling the fetcher
      const fetchedAddress = await fetcher.extractTokenAddress(assetType, block);
      expect(fetchedAddress).toStrictEqual(tokenAddress);
    }
  });
});
