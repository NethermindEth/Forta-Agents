import { Contract, providers, BigNumber } from "ethers";
import { UTOKENS_IFACE, UMEE_ORACLE_PRICE_IFACE, LENDING_POOL_IFACE } from "./utils";
import CONFIG from "./agent.config";

export default class DataFetcher {
  readonly provider: providers.Provider;

  constructor(provider: providers.Provider) {
    this.provider = provider;
  }

  // return the underlying asset address of a uToken
  public async getUnderlyingAssetAddress(uTokenAddress: string, block: string | number): Promise<string> {
    const uTokenContract = new Contract(uTokenAddress, UTOKENS_IFACE, this.provider);

    const underlyingAssetAddress: string = await uTokenContract.UNDERLYING_ASSET_ADDRESS({
      blockTag: block,
    });

    return underlyingAssetAddress;
  }

  // return the price of an asset
  public async getPrice(assetAddress: string, block: string | number): Promise<BigNumber> {
    const oracleContract = new Contract(CONFIG.umeeOracle, UMEE_ORACLE_PRICE_IFACE, this.provider);

    const assetPrice = await oracleContract.getAssetPrice(assetAddress, {
      blockTag: block,
    });

    return assetPrice;
  }

  // return the normalized income of an asset
  public async getReserveNormalizedIncome(assetAddress: string, block: string | number): Promise<BigNumber> {
    const lendingPoolContract = new Contract(CONFIG.lendingPool, LENDING_POOL_IFACE, this.provider);

    const reserveNormalizedIncome = await lendingPoolContract.getReserveNormalizedIncome(assetAddress, {
      blockTag: block,
    });

    return reserveNormalizedIncome;
  }
}
