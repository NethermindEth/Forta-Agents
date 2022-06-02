import { Interface } from "@ethersproject/abi";

import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";

export interface AgentConfig {
  threshold: number;
  lendingPoolAddress: string;
  umeeOracleAddress: string;
}

const UMEE_FUNCTIONS_ABI: string[] = [
  "function getReservesList() external view returns (address[] memory)",
  "function getSourceOfAsset(address asset) external view returns (address)",
  "function latestTimestamp() external view returns (uint256)",
];

const EVENT_ABI = ["event AssetSourceUpdated(address indexed asset, address indexed source)"];

const FUNCTIONS_INTERFACE = new Interface([...UMEE_FUNCTIONS_ABI, ...EVENT_ABI]);

export interface AssetDataI {
  asset: string;
  source: string;
  referenceTimestamp: number;
}

const fetchLatestTimestamp = async (source: string, provider: ethers.providers.Provider): Promise<number> => {
  // use try/catch because source maybe a zero address or a erc20 token without chainLink aggregator support
  try {
    const [chainLinkAggregator, blockNumber] = await Promise.all([
      new ethers.Contract(source, UMEE_FUNCTIONS_ABI, provider),
      provider.getBlockNumber(),
    ]);
    return (await chainLinkAggregator.latestTimestamp({ blockTag: blockNumber })).toNumber();
  } catch (error) {
    return 0;
  }
};

const getAssetData = async (config: AgentConfig, provider: ethers.providers.Provider): Promise<AssetDataI[]> => {
  const lendingPoolContract = new ethers.Contract(config.lendingPoolAddress, UMEE_FUNCTIONS_ABI, provider);
  const umeeOracleContract = new ethers.Contract(config.umeeOracleAddress, UMEE_FUNCTIONS_ABI, provider);
  const blockNumber = await provider.getBlockNumber();
  const reservedList = await lendingPoolContract.getReservesList({ blockTag: blockNumber });
  const sources = await Promise.all(
    reservedList.filter(async (asset: string) => {
      // use try/catch because some asset may be without source
      try {
        return await umeeOracleContract.getSourceOfAsset(asset, { blockTag: blockNumber });
      } catch (error) {
        return false;
      }
    })
  );

  const assetData = await Promise.all(
    sources.map(async (source, index) => {
      const lastUpdatedAt = await fetchLatestTimestamp(source, provider);
      return {
        asset: reservedList[index],
        source: sources[index],
        referenceTimestamp: lastUpdatedAt,
      };
    })
  );
  return assetData;
};

const createFinding = ({ asset, source, referenceTimestamp }: AssetDataI): Finding => {
  return Finding.fromObject({
    name: "Detect stale price data from Chainlink aggregator",
    description: "price of a certain asset stops being updated from Chainlink aggregator",
    alertId: "UMEE-3",
    protocol: "Umee",
    type: FindingType.Info,
    severity: FindingSeverity.Low,
    metadata: { asset, source, referenceTimestamp: referenceTimestamp.toString() },
  });
};

export default {
  FUNCTIONS_INTERFACE,
  EVENT_ABI,
  UMEE_FUNCTIONS_ABI,
  getAssetData,
  fetchLatestTimestamp,
  createFinding,
};
