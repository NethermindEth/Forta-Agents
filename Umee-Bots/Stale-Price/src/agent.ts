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

import utils, { AgentConfig, AssetSourceTimeStampI } from "./utils";

const assetsSourcesList: AssetSourceTimeStampI[] = [];
const initialize = (provider: ethers.providers.Provider) => async () => {
  assetsSourcesList.push(...(await utils.getAssetsSourceTimeStamp(CONFIG, provider)));
};

export const provideHandleTransaction = (
  config: AgentConfig,
  provider: ethers.providers.Provider,
  assetsSourcesList: AssetSourceTimeStampI[]
): HandleTransaction => {
  const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const updateSourceLogs = txEvent.filterLog(utils.EVENT_ABI, config.umeeOracleAddress);
    await Promise.all(
      updateSourceLogs.map(async (logs) => {
        const [asset, source] = logs.args;
        const assetSourceIndex = assetsSourcesList.findIndex((assetSource) => {
          return assetSource.asset;
        });
        const latestTimestamp = await utils.fetchLatestTimestamp(source, provider);

        if (assetSourceIndex < 0) {
          assetsSourcesList.push({
            asset,
            source,
            latestTimestamp,
          });
        } else {
          assetsSourcesList[assetSourceIndex].source = source;
          assetsSourcesList[assetSourceIndex].latestTimestamp = latestTimestamp;
        }

        if (txEvent.block.timestamp - latestTimestamp) {
          findings.push(utils.createFinding({ asset, source, latestTimestamp }));
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
  assetsSourcesList: AssetSourceTimeStampI[]
): HandleBlock => {
  const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    await Promise.all(
      assetsSourcesList.map(async (assetSource) => {
        if (blockEvent.block.timestamp - assetSource.latestTimestamp >= config.threshold) {
          const latestTimestamp = await utils.fetchLatestTimestamp(assetSource.source, provider);
          blockEvent.block.timestamp - latestTimestamp >= config.threshold &&
            findings.push(utils.createFinding(assetSource));
        }
      })
    );

    return findings;
  };
  return handleBlock;
};

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(CONFIG, getEthersProvider(), assetsSourcesList),
  handleBlock: provideHandleBlock(CONFIG, getEthersProvider(), assetsSourcesList),
};
