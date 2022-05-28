import { ethers, Finding, getEthersProvider, HandleTransaction, TransactionEvent } from "forta-agent";

import CONFIG from "./agent.config";

import utils, { AgentConfig, AssetSourceTimeStampI } from "./utils";

const assetsSourcesList: AssetSourceTimeStampI[] = [];
export const initialize = (provider: ethers.providers.Provider) => {
  return async () => {
    assetsSourcesList.push(...(await utils.getAssetsSourceTimeStamp(CONFIG, provider)));
  };
};

export const provideHandleTransaction = (config: AgentConfig): HandleTransaction => {
  const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const updateSourceLogs = txEvent.filterLog(utils.EVENT_ABI, config.umeeOracleAddress);
    updateSourceLogs.map((logs) => {
      const [asset, source] = logs.args;
      const assetSourceTimeStamp = assetsSourcesList.find((assetSource) => {
        return assetSource.asset === asset && assetSource.source === source;
      });
      if (assetSourceTimeStamp) {
        assetsSourcesList.push({ source, asset, lastTimestamp: txEvent.block.timestamp });
      }
    });

    const currentTimestamp = txEvent.block.timestamp;

    assetsSourcesList.map((assetAndSource) => {
      if (currentTimestamp - assetAndSource.lastTimestamp >= config.threshold) {
        findings.push(utils.createFinding(assetAndSource));
      }
    });
    return findings;
  };
  return handleTransaction;
};

export default {
  handleTransaction: provideHandleTransaction(CONFIG),
  initialize: initialize(getEthersProvider()),
};
