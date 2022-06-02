import {
  BlockEvent,
  ethers,
  Finding,
  getEthersProvider,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";

import CONFIG from "./agent.config";

import utils, { AgentConfig, AssetDataI } from "./utils";

const assetsDataList: AssetDataI[] = [];

export const provideInitialize = (provider: ethers.providers.Provider) => {
  const initialize = () => async () => {
    assetsDataList.push(...(await utils.getAssetData(CONFIG, provider)));
    return assetsDataList;
  };
  return initialize;
};

export const provideHandleTransaction = (
  config: AgentConfig,
  provider: ethers.providers.Provider,
  assetsDataList: AssetDataI[]
): HandleTransaction => {
  const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const updateSourceLogs = txEvent.filterLog(utils.EVENT_ABI, config.umeeOracleAddress);
    await Promise.all(
      updateSourceLogs.map(async (logs) => {
        const [asset, source] = logs.args;
        const assetsDataIndex = assetsDataList.findIndex((assetsData) => {
          return assetsData.asset;
        });
        const lastUpdatedAt = await utils.fetchLatestTimestamp(source, provider);

        if (assetsDataIndex === -1) {
          assetsDataList.push({
            asset,
            source,
            lastUpdatedAt,
          });
        } else {
          assetsDataList[assetsDataIndex].source = source;
          assetsDataList[assetsDataIndex].lastUpdatedAt = lastUpdatedAt;
        }

        if (txEvent.block.timestamp - lastUpdatedAt >= config.threshold) {
          findings.push(utils.createFinding({ asset, source, lastUpdatedAt }));
        }
      })
    );
    return findings;
  };
  return handleTransaction;
};

export const provideHandleBlock = (
  config: AgentConfig,
  provider: ethers.providers.Provider,
  assetsDataList: AssetDataI[]
): HandleBlock => {
  const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    await Promise.all(
      assetsDataList.map(async (assetsData) => {
        if (blockEvent.block.timestamp - assetsData.lastUpdatedAt >= config.threshold) {
          const lastUpdatedAt = await utils.fetchLatestTimestamp(assetsData.source, provider);
          if (blockEvent.block.timestamp - lastUpdatedAt >= config.threshold) {
            findings.push(utils.createFinding({ ...assetsData, lastUpdatedAt }));
            assetsData.lastUpdatedAt = blockEvent.block.timestamp;
          } else {
            assetsData.lastUpdatedAt = lastUpdatedAt;
            ``;
          }
        }
      })
    );

    return findings;
  };
  return handleBlock;
};

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(CONFIG, getEthersProvider(), assetsDataList),
  handleBlock: provideHandleBlock(CONFIG, getEthersProvider(), assetsDataList),
};
