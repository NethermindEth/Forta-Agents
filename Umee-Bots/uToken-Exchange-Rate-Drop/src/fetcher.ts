import { Contract, providers } from "ethers";
import { UTOKENS_IFACE, UMEE_ORACLE_PRICE_IFACE, LENDING_POOL_IFACE, AgentConfig } from "./utils";
import { ethersBnToBn } from "./utils";
import BigNumber from "bignumber.js";

export default class DataFetcher {
  readonly provider: providers.Provider;
  readonly config: AgentConfig;

  constructor(provider: providers.Provider, config: AgentConfig) {
    this.provider = provider;
    this.config = config;
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
    const oracleContract = new Contract(this.config.umeeOracle, UMEE_ORACLE_PRICE_IFACE, this.provider);

    const assetPrice = ethersBnToBn(
      await oracleContract.getAssetPrice(assetAddress, {
        blockTag: block,
      }),
      18
    );

    return assetPrice;
  }

  // return the normalized income of an asset
  public async getReserveNormalizedIncome(assetAddress: string, block: string | number): Promise<BigNumber> {
    const lendingPoolContract = new Contract(this.config.lendingPool, LENDING_POOL_IFACE, this.provider);

    const reserveNormalizedIncome = ethersBnToBn(
      await lendingPoolContract.getReserveNormalizedIncome(assetAddress, {
        blockTag: block,
      }),
      18
    );

    return reserveNormalizedIncome;
  }
}
