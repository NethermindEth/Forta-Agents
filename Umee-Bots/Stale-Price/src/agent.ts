import { ethers, Finding, getEthersProvider, HandleTransaction, TransactionEvent } from "forta-agent";

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
    updateSourceLogs.map(async (logs) => {
      const [asset, source] = logs.args;
      const assetSource = assetsSourcesList.find((assetSource) => {
        return assetSource.asset;
      });
      if (!assetSource) {
        const latestTimestamp = await utils.fetchLatestTimestamp(source, provider);
        assetsSourcesList.push({ source, asset, latestTimestamp: latestTimestamp.toNumber() || txEvent.block.timestamp });
        return;
      }
    });

    assetsSourcesList.map((assetSource) => {
      const currentTimestamp = txEvent.block.timestamp;
      if (currentTimestamp - assetSource.latestTimestamp >= config.threshold) {
        findings.push(utils.createFinding(assetSource));
      }
    });

    return findings;
  };
  return handleTransaction;
};

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(CONFIG, getEthersProvider(), assetsSourcesList),
};
