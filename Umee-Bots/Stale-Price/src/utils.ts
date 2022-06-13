import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";

export interface AgentConfig {
  threshold: number;
  lendingPoolAddress: string;
  umeeOracleAddress: string;
}

export const GET_RESERVES_LIST_ABI = "function getReservesList() external view returns (address[] memory)";
export const GET_SOURCE_OF_ASSET_ABI = "function getSourceOfAsset(address asset) external view returns (address)";
export const LATEST_TIMESTAMP_ABI = "function latestTimestamp() external view returns (uint256)";

export const ASSET_SOURCE_UPDATED_ABI = "event AssetSourceUpdated(address indexed asset, address indexed source)";

const SOURCE_IFACE = new ethers.utils.Interface([LATEST_TIMESTAMP_ABI]);
const LENDING_POOL_IFACE = new ethers.utils.Interface([GET_RESERVES_LIST_ABI]);
const UMEE_ORACLE_IFACE = new ethers.utils.Interface([GET_SOURCE_OF_ASSET_ABI]);

export interface AssetData {
  asset: string;
  source: string;
  referenceTimestamp: number;
}

export const fetchLatestTimestamp = async (
  source: string,
  provider: ethers.providers.Provider,
  blockTag: number | string = "latest"
): Promise<number | null> => {
  // use try/catch because source maybe a zero address or a erc20 token without chainLink aggregator support
  try {
    const chainLinkAggregator = new ethers.Contract(source, SOURCE_IFACE, provider);
    return (await chainLinkAggregator.latestTimestamp({ blockTag })).toNumber();
  } catch (error) {
    return null;
  }
};

export const getAssetSource = async (
  asset: string,
  provider: ethers.providers.Provider,
  config: AgentConfig
): Promise<string> => {
  const umeeOracleContract = new ethers.Contract(config.umeeOracleAddress, UMEE_ORACLE_IFACE, provider);

  return await umeeOracleContract.getSourceOfAsset(asset, { blockTag: "latest" });
};

export const getAssetData = async (provider: ethers.providers.Provider, config: AgentConfig): Promise<AssetData[]> => {
  const lendingPoolContract = new ethers.Contract(config.lendingPoolAddress, LENDING_POOL_IFACE, provider);

  const reservesList: string[] = await lendingPoolContract.getReservesList({ blockTag: "latest" });

  const sources = await Promise.all(reservesList.map((asset) => getAssetSource(asset, provider, config)));

  const assetData = await Promise.all(
    sources.map(async (source, index) => {
      const lastUpdatedAt = await fetchLatestTimestamp(source, provider);
      return {
        asset: reservesList[index].toLowerCase(),
        source: sources[index].toLowerCase(),
        referenceTimestamp: lastUpdatedAt || 0,
      };
    })
  );

  return assetData;
};

export const createFinding = ({ asset, source, referenceTimestamp }: AssetData): Finding => {
  return Finding.fromObject({
    name: "Detect stale price data from Chainlink aggregator",
    description: "price of a certain asset stops being updated from Chainlink aggregator",
    alertId: "UMEE-3",
    protocol: "Umee",
    type: FindingType.Suspicious,
    severity: FindingSeverity.Medium,
    metadata: { asset, source, referenceTimestamp: referenceTimestamp.toString() },
  });
};
