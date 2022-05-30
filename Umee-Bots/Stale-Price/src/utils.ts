import { Interface } from "@ethersproject/abi";

import { ethers, Finding, FindingSeverity, FindingType, getEthersProvider } from "forta-agent";

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

export interface AssetSourceTimeStampI {
  asset: string;
  source: string;
  latestTimestamp: number;
}

const fetchLatestTimestamp = async (source: string, provider: ethers.providers.Provider): Promise<ethers.BigNumber> => {
  // use try/catch because source maybe a zero address or a erc20 token without chainLink aggregator support
  try {
    const [chainLinkAggregator, blockNumber] = await Promise.all([
      new ethers.Contract(source, UMEE_FUNCTIONS_ABI, provider),
      provider.getBlockNumber(),
    ]);
    return await chainLinkAggregator.latestTimestamp({ blockTag: blockNumber });
  } catch (error) {
    return ethers.BigNumber.from(0);
  }
};

const getAssetsSourceTimeStamp = async (
  config: AgentConfig,
  provider: ethers.providers.Provider
): Promise<AssetSourceTimeStampI[]> => {
  const lendingPoolContract = new ethers.Contract(config.lendingPoolAddress, UMEE_FUNCTIONS_ABI, provider);
  const umeeOracleContract = new ethers.Contract(config.umeeOracleAddress, UMEE_FUNCTIONS_ABI, provider);

  const reservedList = await lendingPoolContract.getReservesList();
  const sources = await Promise.all(
    reservedList.filter(async (asset: string) => {
      // use try/catch because some asset may be without source
      try {
        return await umeeOracleContract.getSourceOfAsset(asset);
      } catch (error) {
        return false;
      }
    })
  );
  return await Promise.all(
    sources.filter(async (source, index) => {
      const latestTimestamp = await fetchLatestTimestamp(source, provider);
      return {
        asset: reservedList[index],
        source: sources[index],
        latestTimestamp,
      };
    })
  );
};

const createFinding = ({ asset, source, latestTimestamp }: AssetSourceTimeStampI): Finding => {
  return Finding.fromObject({
    name: "Detect stale price data from Chainlink aggregator",
    description: "Stale price data is detected from Chainlink aggregator",
    alertId: "UMEE-3",
    type: FindingType.Info,
    severity: FindingSeverity.Low,
    metadata: { asset, source, lastTimestamp: latestTimestamp.toString() },
  });
};

export default {
  FUNCTIONS_INTERFACE,
  EVENT_ABI,
  UMEE_FUNCTIONS_ABI,
  getAssetsSourceTimeStamp,
  fetchLatestTimestamp,
  createFinding,
};
