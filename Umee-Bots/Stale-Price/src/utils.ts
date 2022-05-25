import { Interface } from "@ethersproject/abi";

import { ethers, Finding, FindingSeverity, FindingType, getEthersProvider } from "forta-agent";

export interface AgentConfig {
  threshold: number;
  lendingPoolAddress: string;
  umeeOracleAddress: string;
}

const UMEE_FUNCTIONS_ABI: string[] = [
  "function getReservesList() external view override returns (address[] memory)",
  "function getSourceOfAsset(address asset) external view returns (address)",
  "function latestTimestamp() external view returns (uint256)",
];

const EVENT_ABI = ["  event AssetSourceUpdated(address indexed asset, address indexed source)"];

const FUNCTIONS_INTERFACE = new Interface(UMEE_FUNCTIONS_ABI);

export interface AssetSourceTimeStampI {
  asset: string;
  source: string;
  timestamp: number;
}
const getAssetsSourceTimeStamp = async (
  config: AgentConfig,
  provider: ethers.providers.Provider
): Promise<AssetSourceTimeStampI[]> => {
  const lendingPoolContract = new ethers.Contract(config.lendingPoolAddress, UMEE_FUNCTIONS_ABI, provider);
  const umeeOracleContract = new ethers.Contract(config.umeeOracleAddress, UMEE_FUNCTIONS_ABI, provider);

  const reservedList = lendingPoolContract.getReservesList();

  const sources = await Promise.all(
    reservedList.map(async (asset: string): Promise<string> => {
      return await umeeOracleContract.getSourceOfAsset(asset);
    })
  );

  return await Promise.all(
    sources.map(async (source, index) => {
      const chainLinkAggregator = await new ethers.Contract(source, UMEE_FUNCTIONS_ABI, provider);
      const timestamp = await chainLinkAggregator.latestTimestamp();
      return {
        asset: reservedList[index],
        source: sources[index],
        timestamp,
      };
    })
  );
};

const createFinding = (initialCallSelector: string, lendingPoolCallSelector: string): Finding => {
  return Finding.fromObject({
    name: "Detect stale price data from Chainlink aggregator",
    description: "Stale price data is detected from Chainlink aggregator",
    alertId: "UMEE-3",
    type: FindingType.Info,
    severity: FindingSeverity.Low,
    metadata: {
      initialCallSelector,
      lendingPoolCallSelector,
    },
  });
};

export default {
  FUNCTIONS_INTERFACE,
  EVENT_ABI,
  UMEE_FUNCTIONS_ABI,
  getAssetsSourceTimeStamp,
  createFinding,
};
