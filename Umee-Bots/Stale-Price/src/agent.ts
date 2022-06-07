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

import utils, { AgentConfig, AssetData } from "./utils";

const assetsDataList: AssetData[] = [];

export const provideInitialize =
  (provider: ethers.providers.Provider): Initialize =>
  async () => {
    assetsDataList.push(...(await utils.getAssetData(CONFIG, provider)));
  };

export const provideHandleTransaction = (
  config: AgentConfig,
  provider: ethers.providers.Provider,
  assetsDataList: AssetData[]
): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const updateSourceLogs = txEvent.filterLog(utils.EVENT_ABI, config.umeeOracleAddress);
    await Promise.all(
      updateSourceLogs.map(async (logs) => {
        const [asset, source] = logs.args;
        const assetsDataIndex = assetsDataList.findIndex((assetsData) => {
          return assetsData.asset === asset.toLowerCase();
        });
        const lastUpdatedAt = await utils.fetchLatestTimestamp(source, provider);
        if (assetsDataIndex === -1) {
          assetsDataList.push({
            asset: asset.toLowerCase(),
            source,
            referenceTimestamp: lastUpdatedAt,
          });
        } else {
          assetsDataList[assetsDataIndex].source = source;
          assetsDataList[assetsDataIndex].referenceTimestamp = lastUpdatedAt;
        }
        if (txEvent.block.timestamp - lastUpdatedAt >= config.threshold) {
          findings.push(utils.createFinding({ asset, source, referenceTimestamp: lastUpdatedAt }));
          const index = assetsDataIndex === -1 ? assetsDataList.length - 1 : assetsDataIndex;
          assetsDataList[index].referenceTimestamp = lastUpdatedAt;
        }
      })
    );
    return findings;
  };
};

export const provideHandleBlock = (
  config: AgentConfig,
  provider: ethers.providers.Provider,
  assetsDataList: AssetData[]
): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    await Promise.all(
      assetsDataList.map(async (assetsData) => {
        if (blockEvent.block.timestamp - assetsData.referenceTimestamp >= config.threshold) {
          const lastUpdatedAt = await utils.fetchLatestTimestamp(assetsData.source, provider);
          if (blockEvent.block.timestamp - lastUpdatedAt >= config.threshold) {
            findings.push(utils.createFinding({ ...assetsData, referenceTimestamp: lastUpdatedAt }));
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
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(CONFIG, getEthersProvider(), assetsDataList),
  handleBlock: provideHandleBlock(CONFIG, getEthersProvider(), assetsDataList),
};
