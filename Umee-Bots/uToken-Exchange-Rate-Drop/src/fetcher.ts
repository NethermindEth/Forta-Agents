import { Contract, providers, BigNumber, utils } from "ethers";
import {
  UTOKENS_IFACE,
  UMEE_ORACLE,
  UMEE_ORACLE_PRICE_IFACE,
  LENDING_POOL,
  LENDING_POOL_IFACE,
} from "./utils";

export default class DataFetcher {
  readonly provider: providers.Provider;

  constructor(provider: providers.Provider) {
    this.provider = provider;
  }

  // return the underlying asset address of a uToken
  public async getUnderlyingAssetAddress(
    uTokenAddress: string,
    block: string | number
  ): Promise<string> {
    const uTokenContract = new Contract(uTokenAddress, UTOKENS_IFACE, this.provider);

    const underlyingAssetAddress: string = await uTokenContract.UNDERLYING_ASSET_ADDRESS({
      blockTag: block,
    });

    return underlyingAssetAddress;
  }

  public async getPrice(
    assetAddress: string,
    block: string | number
  ): Promise<BigNumber> {
    const oracleContract = new Contract(
      UMEE_ORACLE,
      UMEE_ORACLE_PRICE_IFACE,
      this.provider
    );

    const assetPrice = await oracleContract.getAssetPrice(assetAddress, {
      blockTag: block,
    });

    return assetPrice;
  }

  public async getReserveNormalizedIncome(
    assetAddress: string,
    block: string | number
  ): Promise<BigNumber> {
    const lendingPoolContract = new Contract(
      LENDING_POOL,
      LENDING_POOL_IFACE,
      this.provider
    );

    const reserveNormalizedIncome = await lendingPoolContract.getReserveNormalizedIncome(
      assetAddress,
      {
        blockTag: block,
      }
    );

    return reserveNormalizedIncome;
  }
}
