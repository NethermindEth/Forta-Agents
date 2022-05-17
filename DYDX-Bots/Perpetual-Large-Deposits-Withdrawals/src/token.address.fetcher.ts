import { providers, BigNumber } from "ethers";
import { hexDataSlice, solidityKeccak256 } from "ethers/lib/utils";
import NetworkData from "./network";

export default class TokenAddressFetcher {
  provider: providers.Provider;
  networkManager: NetworkData;

  constructor(provider: providers.Provider, networkManager: NetworkData) {
    this.provider = provider;
    this.networkManager = networkManager;
  }

  // Function to read the system assetType from the contract storage.
  // Does not use cache because it's called once only when the bot is initialized.
  public getSystemAssetType = async (block: number | string): Promise<BigNumber> => {
    const systemAssetType = BigNumber.from(
      await this.provider.getStorageAt(this.networkManager.perpetualProxy, this.networkManager.slots.systemSlot, block)
    );
    return systemAssetType;
  };

  // function to extract the token address from the assetType.
  // Reads the contract mapping to get assetInfo. Then applies an offset to get the address.
  // Does not use cache because it's called once only when the bot is initialized.
  public extractTokenAddress = async (assetType: BigNumber, block: number | string): Promise<string> => {
    const OFFSET = 16;

    // extract AssetInfo.
    // sizeSlot stores the (data length * 2 + 1) since it is >= 32bytes.
    const sizeSlot = solidityKeccak256(
      ["uint", "uint"],
      [assetType.toHexString(), this.networkManager.slots.mappingSlot]
    );

    // dataSlot is the slot where data begins.
    const dataSlot = solidityKeccak256(["uint"], [sizeSlot]);

    // assetInfo is 36bytes long, therefore stored on two slots.
    const [data1, data2] = await Promise.all([
      this.provider.getStorageAt(this.networkManager.perpetualProxy.toLocaleLowerCase(), dataSlot, block),
      this.provider.getStorageAt(
        this.networkManager.perpetualProxy.toLocaleLowerCase(),
        BigNumber.from(dataSlot).add(1),
        block
      ),
    ]);

    // we extract the assetInfo from the two slots.
    const assetInfo = data1 + data2.slice(2, 10);

    // extract token address
    const tokenAddress = hexDataSlice(assetInfo, OFFSET);
    return tokenAddress;
  };
}
