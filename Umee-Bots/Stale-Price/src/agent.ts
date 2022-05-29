import { ethers, Finding, getEthersProvider, HandleTransaction, TransactionEvent } from "forta-agent";

import CONFIG from "./agent.config";

import utils, { AgentConfig, AssetSourceTimeStampI } from "./utils";

const assetsSourcesList: AssetSourceTimeStampI[] = [];
const initialize = (provider: ethers.providers.Provider) => async () => {
  assetsSourcesList.push(...(await utils.getAssetsSourceTimeStamp(CONFIG, provider)));
};

export const provideHandleTransaction = (
  config: AgentConfig,
  assetsSourcesList: AssetSourceTimeStampI[]
): HandleTransaction => {
  const handleTransaction: HandleTransaction = async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const updateSourceLogs = txEvent.filterLog(utils.EVENT_ABI, config.umeeOracleAddress);
    updateSourceLogs.map((logs) => {
      const [asset, source] = logs.args;
      const isNewPrice = assetsSourcesList.find((assetSource) => {
        return assetSource.asset === asset && assetSource.source === source;
      });
      if (isNewPrice) {
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
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(CONFIG, assetsSourcesList),
};
