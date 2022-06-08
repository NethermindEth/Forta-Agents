import {
  BlockEvent,
  ethers,
  Finding,
  getEthersProvider,
  HandleBlock,
  HandleTransaction,
  Initialize,
  TransactionEvent,
} from "forta-agent";

import CONFIG from "./agent.config";

import {
  AgentConfig,
  AssetData,
  ASSET_SOURCE_UPDATED_ABI,
  createFinding,
  fetchLatestTimestamp,
  getAssetData,
} from "./utils";

const assetsDataList: AssetData[] = [];

export const getAssetsDataList = () => assetsDataList;
export const resetAssetsDataList = () => (assetsDataList.length = 0);

export const provideInitialize = (provider: ethers.providers.Provider, config: AgentConfig): Initialize => {
  return async () => {
    assetsDataList.push(...(await getAssetData(provider, config)));
  };
};

export const provideHandleTransaction = (
  provider: ethers.providers.Provider,
  config: AgentConfig
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const updateSourceLogs = txEvent.filterLog([ASSET_SOURCE_UPDATED_ABI], config.umeeOracleAddress);

    await Promise.all(
      updateSourceLogs.map(async (logs) => {
        let [asset, source] = logs.args.map((el) => el.toLowerCase());

        const assetsDataIndex = assetsDataList.findIndex((assetsData) => {
          return assetsData.asset === asset;
        });

        const lastUpdatedAt = await fetchLatestTimestamp(source, provider, txEvent.blockNumber);

        if (assetsDataIndex === -1) {
          assetsDataList.push({
            asset,
            source,
            referenceTimestamp: lastUpdatedAt || 0,
          });
        } else {
          assetsDataList[assetsDataIndex].source = source;
          assetsDataList[assetsDataIndex].referenceTimestamp = lastUpdatedAt || 0;
        }

        if (lastUpdatedAt !== null && txEvent.block.timestamp - lastUpdatedAt >= config.threshold) {
          findings.push(createFinding({ asset, source, referenceTimestamp: lastUpdatedAt }));
          const index = assetsDataIndex === -1 ? assetsDataList.length - 1 : assetsDataIndex;
          assetsDataList[index].referenceTimestamp = txEvent.block.timestamp;
        }
      })
    );

    return findings;
  };
};

export const provideHandleBlock = (provider: ethers.providers.Provider, config: AgentConfig): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    await Promise.all(
      assetsDataList.map(async (assetsData) => {
        if (blockEvent.block.timestamp - assetsData.referenceTimestamp >= config.threshold) {
          const lastUpdatedAt = await fetchLatestTimestamp(assetsData.source, provider, blockEvent.blockNumber);

          if (lastUpdatedAt === null) {
            // if the source is invalid, it will eventually be updated and then handleTransaction will update it locally
            return;
          }

          if (blockEvent.block.timestamp - lastUpdatedAt >= config.threshold) {
            findings.push(createFinding({ ...assetsData, referenceTimestamp: lastUpdatedAt }));
            assetsData.referenceTimestamp = blockEvent.block.timestamp;
          } else {
            assetsData.referenceTimestamp = lastUpdatedAt;
          }
        }
      })
    );

    return findings;
  };
};

export default {
  initialize: provideInitialize(getEthersProvider(), CONFIG),
  handleTransaction: provideHandleTransaction(getEthersProvider(), CONFIG),
  handleBlock: provideHandleBlock(getEthersProvider(), CONFIG),
};
