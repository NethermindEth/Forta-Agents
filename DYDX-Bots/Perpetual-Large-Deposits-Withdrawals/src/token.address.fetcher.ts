import { providers, BigNumber } from "ethers";
import { hexDataSlice, solidityKeccak256 } from "ethers/lib/utils";
import LRU from "lru-cache";
import NetworkData from "./network";

export default class TokenAddressFetcher {
  provider: providers.Provider;
  private cache: LRU<string, string>;
  networkManager: NetworkData;

  constructor(provider: providers.Provider, networkManager: NetworkData) {
    this.provider = provider;
    this.cache = new LRU<string, string>({
      max: 10000,
    });
    this.networkManager = networkManager;
  }

  // Function to read the system assetType.
  // Does not uses cache because it's called once only when the bot is initialized.
  public getSystemAssetType = async (block: number | string): Promise<BigNumber> => {
    const systemAssetType = BigNumber.from(
      await this.provider.getStorageAt(
        this.networkManager.perpetualProxy,
        BigNumber.from(this.networkManager.slots.systemSlot).toHexString(),
        block
      )
    );
    return systemAssetType;
  };

  // function to extract the token address from the assetType.
  // Reads the contract mapping to get assetInfo. Then applies an offset to get the address.
  public extractTokenAddress = async (assetType: BigNumber, block: number | string): Promise<string> => {
    const key: string = `${assetType.toHexString()} - ${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as string;

    const OFFSET = 16; // used to extract token address from assetInfo
    let tokenAddress;

    // extract AssetInfo.
    // first slot:  This slot stores the data_length*2+1 because it's >= 32bytes.
    const sizeSlot = solidityKeccak256(
      ["uint", "uint"],
      [assetType.toHexString(), this.networkManager.slots.mappingSlot]
    );

    // dataSlot is the slot where data begins.
    const dataSlot = solidityKeccak256(["uint"], [sizeSlot]);

    const [data1, data2] = await Promise.all([
      this.provider.getStorageAt(this.networkManager.perpetualProxy.toLocaleLowerCase(), dataSlot),
      this.provider.getStorageAt(
        this.networkManager.perpetualProxy.toLocaleLowerCase(),
        BigNumber.from(dataSlot).add(1)
      ),
    ]);
    // we extract the assetInfo from the two slots.
    const assetInfo = data1 + data2.slice(2, 10);

    // extract token address
    tokenAddress = hexDataSlice(assetInfo, OFFSET);

    this.cache.set(key, tokenAddress);
    return tokenAddress;
  };
}
